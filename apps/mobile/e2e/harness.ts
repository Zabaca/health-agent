/**
 * Lifecycle for an E2E run: temp DB + migrations, the throwaway web server, the
 * Metro packager (pointed at that server), and the Maestro flow runner.
 *
 * Boots everything once; run.ts sequences flows against it; teardown stops the
 * long-running children. Designed to be run via `bun` from the repo shell so the
 * root .env secrets (JWT signing key, etc.) are present — we also explicitly load
 * REPO_ROOT/.env so it works even without direnv.
 */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createWriteStream, existsSync, readFileSync } from "node:fs";
import {
  APP_ID, E2E_SIM_DEVICE_TYPE, E2E_SIM_NAME, METRO_PORT, MOBILE_DIR, REPO_ROOT,
  TEST_API_PORT, TEST_API_URL, WEB_DIR, dbUrl,
} from "./config";

const children: ChildProcess[] = [];

/** Minimal .env parser so the spawned web server gets root secrets. */
export function loadRootEnv(): Record<string, string> {
  const file = `${REPO_ROOT}/.env`;
  const out: Record<string, string> = {};
  if (!existsSync(file)) return out;
  for (const raw of readFileSync(file, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const log = (m: string) => console.log(`\x1b[36m[e2e]\x1b[0m ${m}`);

function track(c: ChildProcess): ChildProcess {
  children.push(c);
  return c;
}

/**
 * Spawn a long-running child, draining stdout/stderr to a log file. Draining is
 * essential: an undrained 'pipe' fills its OS buffer and deadlocks the child
 * (next dev / Metro are chatty). Returns the child + its log path.
 */
function spawnLogged(
  cmd: string, args: string[], opts: { cwd: string; env: NodeJS.ProcessEnv }, logName: string,
): { child: ChildProcess; logPath: string } {
  const logPath = `/tmp/veladon-e2e-${logName}.log`;
  const out = createWriteStream(logPath);
  const child = track(spawn(cmd, args, { ...opts, stdio: ["ignore", "pipe", "pipe"] }));
  child.stdout?.pipe(out);
  child.stderr?.pipe(out);
  return { child, logPath };
}

/** Create + migrate a fresh temp DB. Throws on non-zero migrate exit. */
export function migrateTempDb(dbPath: string, rootEnv: Record<string, string>): void {
  log(`migrating temp DB ${dbPath}`);
  const r = spawnSync("bun", ["run", "--cwd", WEB_DIR, "db:migrate"], {
    cwd: REPO_ROOT,
    env: { ...process.env, ...rootEnv, DATABASE_URL: dbUrl(dbPath) },
    stdio: "inherit",
  });
  if (r.status !== 0) throw new Error(`db:migrate failed (exit ${r.status})`);
}

async function waitForHttp(url: string, label: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      // Any HTTP response (even 404) means the server is up and compiled.
      await fetch(url);
      log(`${label} ready (${Math.round((Date.now() - start) / 1000)}s)`);
      return;
    } catch {
      await Bun.sleep(1000);
    }
  }
  throw new Error(`${label} not ready after ${timeoutMs}ms`);
}

/** Start `next dev` against the temp DB on the dedicated test port. */
export async function startWebServer(dbPath: string, rootEnv: Record<string, string>): Promise<void> {
  log(`starting test web server on :${TEST_API_PORT}`);
  const { logPath } = spawnLogged("bun", ["run", "--cwd", WEB_DIR, "dev", "--port", String(TEST_API_PORT)], {
    cwd: REPO_ROOT,
    env: {
      ...process.env, ...rootEnv,
      DATABASE_URL: dbUrl(dbPath),
      PORT: String(TEST_API_PORT),
      NEXTAUTH_URL: TEST_API_URL,
      // Hermetic uploads: /api/upload skips the real R2 PutObject (no creds in
      // the test env; never pollutes the live bucket) but still runs the rest
      // of the route — MIME validation + the IncomingFile/FileUploadLog inserts.
      E2E_NO_R2: "1",
    },
  }, "web");
  log(`  (web server log → ${logPath})`);
  // First request triggers Next's on-demand compile, so allow a generous wait.
  await waitForHttp(TEST_API_URL, "web server", 180_000);
}

/** Start Metro with a cleared cache, pointed at the test server. */
export async function startMetro(): Promise<void> {
  log("starting Metro (--clear) → EXPO_PUBLIC_API_URL=" + TEST_API_URL);
  // Non-interactive (piped) Expo: comes up fast and reliably. It suppresses the
  // streamed device JS console, so app console.warn/error are captured instead
  // via the in-app E2E forwarder (→ /api/e2e-log → web.log). See src/lib/e2eConsole.ts.
  const { logPath } = spawnLogged("bunx", ["expo", "start", "--dev-client", "--clear", "--port", String(METRO_PORT)], {
    cwd: REPO_ROOT + "/apps/mobile",
    env: { ...process.env, EXPO_PUBLIC_API_URL: TEST_API_URL, EXPO_PUBLIC_E2E: "1" },
  }, "metro");
  log(`  (metro log → ${logPath})`);
  await waitForHttp(`http://localhost:${METRO_PORT}/status`, "metro", 60_000);
  // Pre-build the iOS bundle so the first app launch doesn't time out.
  log("pre-building iOS bundle…");
  await fetch(`http://localhost:${METRO_PORT}/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true`);
  log("iOS bundle ready");
}

type SimDevice = { udid: string; name: string; state: string };

function listDevices(): Record<string, SimDevice[]> {
  const r = spawnSync("xcrun", ["simctl", "list", "devices", "-j"], { encoding: "utf8" });
  try {
    return (JSON.parse(r.stdout) as { devices: Record<string, SimDevice[]> }).devices;
  } catch {
    return {};
  }
}

/** Newest available iOS runtime identifier (for creating the E2E sim). */
function latestIosRuntime(): string {
  const r = spawnSync("xcrun", ["simctl", "list", "runtimes", "-j"], { encoding: "utf8" });
  const runtimes = (JSON.parse(r.stdout) as {
    runtimes: { identifier: string; isAvailable: boolean; name: string }[];
  }).runtimes
    .filter((rt) => rt.isAvailable && rt.identifier.includes("iOS"));
  if (!runtimes.length) throw new Error("No available iOS simulator runtime found.");
  return runtimes[runtimes.length - 1].identifier;
}

/**
 * Ensure the dedicated E2E sim exists + is booted; return its udid. Reused
 * across runs. The sim is intentionally never signed into iCloud.
 */
export function ensureE2eSim(): string {
  let udid: string | undefined;
  for (const devs of Object.values(listDevices())) {
    const found = devs.find((d) => d.name === E2E_SIM_NAME);
    if (found) { udid = found.udid; break; }
  }
  if (!udid) {
    log(`creating E2E simulator "${E2E_SIM_NAME}"`);
    const r = spawnSync("xcrun", ["simctl", "create", E2E_SIM_NAME, E2E_SIM_DEVICE_TYPE, latestIosRuntime()], { encoding: "utf8" });
    if (r.status !== 0) throw new Error(`simctl create failed: ${r.stderr}`);
    udid = r.stdout.trim();
  }
  log(`booting E2E sim ${udid}`);
  spawnSync("xcrun", ["simctl", "boot", udid], { encoding: "utf8" }); // no-op if booted
  spawnSync("xcrun", ["simctl", "bootstatus", udid, "-b"], { stdio: "ignore" });
  spawnSync("open", ["-a", "Simulator", "--args", "-CurrentDeviceUDID", udid]);
  return udid;
}

/** Find the app bundle from any sim that has it installed (the dev sim). */
function sourceAppPath(excludeUdid: string): string | undefined {
  for (const devs of Object.values(listDevices())) {
    for (const d of devs) {
      if (d.udid === excludeUdid) continue;
      const r = spawnSync("xcrun", ["simctl", "get_app_container", d.udid, APP_ID, "app"], { encoding: "utf8" });
      const p = r.stdout.trim();
      if (r.status === 0 && p && existsSync(p)) return p;
    }
  }
  return undefined;
}

/** Install the debug .app on the E2E sim, copied from the dev sim's container. */
export function installAppOnSim(udid: string): void {
  // Already installed? Reuse (the debug build loads JS from Metro, so it stays current).
  const have = spawnSync("xcrun", ["simctl", "get_app_container", udid, APP_ID, "app"], { encoding: "utf8" });
  if (have.status === 0 && have.stdout.trim()) { log("app already installed on E2E sim"); return; }
  const src = sourceAppPath(udid);
  if (!src) {
    throw new Error(
      `Could not find an installed ${APP_ID}.app to copy. Build once with \`bun run ios\` (any sim), then re-run.`,
    );
  }
  log(`installing app on E2E sim from ${src}`);
  const r = spawnSync("xcrun", ["simctl", "install", udid, src], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`simctl install failed: ${r.stderr}`);
}

/**
 * Pre-grant Photos access and seed the sim's photo library with one image, so
 * the in-app "Photo Library" picker opens without a system permission dialog and
 * has a selectable photo. Reuses the app icon (a real, valid PNG) as the sample
 * — simctl addmedia only accepts images/videos, so this is an image, not a PDF.
 */
export function seedPhotoLibrary(udid: string): void {
  // `photos` = read access (PHPhotoLibrary); granting it suppresses the
  // "Allow Access to Photos" prompt that would otherwise steal focus.
  // Both simctl calls are time-bounded: addmedia can hang indefinitely on a
  // wedged sim photo daemon, and seeding is best-effort (only journeys 7/9 need
  // it) — never let it block the whole run.
  spawnSync("xcrun", ["simctl", "privacy", udid, "grant", "photos", APP_ID], { stdio: "ignore", timeout: 20_000, killSignal: "SIGKILL" });
  const photo = `${MOBILE_DIR}/assets/icon.png`;
  const r = spawnSync("xcrun", ["simctl", "addmedia", udid, photo], { encoding: "utf8", timeout: 60_000, killSignal: "SIGKILL" });
  if (r.status !== 0 || r.signal) {
    log(`warning: addmedia failed/timed out (photo picker may be empty): ${r.signal ?? r.stderr}`);
  } else {
    log("seeded photo library with a sample image");
  }
}

/**
 * Kill anything already listening on the test web-server / Metro ports. A run
 * that's killed with SIGKILL (or crashes) can't run teardown, leaving orphaned
 * `next dev` / Metro children bound to these ports — which would silently
 * poison the next run (the app would talk to a stale server on a stale DB).
 * Clearing them up front makes each run self-correcting. Only touches the
 * dedicated E2E ports, never the developer's :3000 dev server.
 */
export function freeStalePorts(): void {
  for (const port of [TEST_API_PORT, METRO_PORT]) {
    const r = spawnSync("lsof", ["-ti", `tcp:${port}`, "-sTCP:LISTEN"], { encoding: "utf8" });
    const pids = r.stdout.split("\n").map((s) => s.trim()).filter(Boolean);
    if (pids.length) {
      log(`freeing stale listener(s) on :${port} (pid ${pids.join(", ")})`);
      spawnSync("kill", ["-9", ...pids], { stdio: "ignore" });
    }
  }
}

/** CFBundleExecutable of the installed app (the os_log process name), if found. */
function appExecutableName(udid: string): string | undefined {
  const c = spawnSync("xcrun", ["simctl", "get_app_container", udid, APP_ID, "app"], { encoding: "utf8" });
  const appPath = c.stdout.trim();
  if (c.status !== 0 || !appPath) return undefined;
  const r = spawnSync("/usr/libexec/PlistBuddy", ["-c", "Print :CFBundleExecutable", `${appPath}/Info.plist`], { encoding: "utf8" });
  return r.status === 0 ? r.stdout.trim() : undefined;
}

/**
 * Stream the booted sim's unified log for the app process to a file, so native
 * crashes / os_log output are captured for post-run review. JS `console.*` and
 * redbox errors already land in the Metro log; this complements that with the
 * native side. Best-effort — if the process name can't be resolved we skip it.
 */
export function startAppLogCapture(udid: string): string | undefined {
  const exe = appExecutableName(udid);
  if (!exe) { log("app log capture skipped (couldn't resolve executable name)"); return undefined; }
  const logPath = "/tmp/veladon-e2e-app.log";
  const out = createWriteStream(logPath);
  const child = track(spawn(
    "xcrun",
    ["simctl", "spawn", udid, "log", "stream", "--level=debug", "--style=syslog", "--predicate", `process == "${exe}"`],
    { stdio: ["ignore", "pipe", "pipe"] },
  ));
  child.stdout?.pipe(out);
  child.stderr?.pipe(out);
  log(`app console log → ${logPath} (process "${exe}")`);
  return logPath;
}

/**
 * Start the CDP console capture (e2e/cdpCapture.ts) as a tracked child. It polls
 * Metro's inspector and records every device console message — including RN 0.76
 * warnings whose content is routed to the debugger and shown only as "Open
 * debugger to view warnings" in LogBox — to /tmp/veladon-e2e-cdp.log. Start it
 * after Metro is up; it connects on its own once the app registers a target.
 */
export function startCdpCapture(): void {
  const child = track(spawn("bun", ["e2e/cdpCapture.ts"], {
    cwd: REPO_ROOT + "/apps/mobile",
    env: { ...process.env },
    stdio: ["ignore", "ignore", "ignore"],
  }));
  void child;
  log("CDP console capture → /tmp/veladon-e2e-cdp.log");
}

export type FlowResult = { flow: string; passed: boolean };

/** Run one Maestro flow with the given -e env vars. Returns pass/fail. */
export function runMaestroFlow(
  flowFile: string,
  env: Record<string, string>,
  udid?: string,
): FlowResult {
  const eArgs = Object.entries(env).flatMap(([k, v]) => ["-e", `${k}=${v}`]);
  const args = ["test", ...(udid ? ["--udid", udid] : []), ...eArgs, flowFile];
  log(`maestro ${args.join(" ")}`);
  // Per-flow timeout: a Maestro/XCUITest driver error (e.g. iOS 26.x
  // `kAXErrorInvalidUIElement`) can wedge `maestro test` so it never exits,
  // hanging the whole run. Bound it so a bad flow fails fast and the suite
  // continues to a full report instead of blocking forever.
  const r = spawnSync("maestro", args, {
    cwd: REPO_ROOT + "/apps/mobile",
    env: { ...process.env, MAESTRO_CLI_NO_ANALYTICS: "1", PATH: `/opt/homebrew/bin:${process.env.PATH}` },
    stdio: "inherit",
    timeout: 300_000,
    killSignal: "SIGKILL",
  });
  if (r.signal) {
    // Timed out / killed → the XCUITest runner is likely wedged. Clear it so the
    // next flow re-spawns a fresh driver instead of cascading the same failure.
    log(`maestro flow timed out (${r.signal}); clearing wedged driver`);
    spawnSync("pkill", ["-9", "-f", "maestro-driver-iosUITests-Runner"], { stdio: "ignore" });
    spawnSync("pkill", ["-9", "-f", "maestro.cli.AppKt"], { stdio: "ignore" });
  }
  return { flow: flowFile, passed: r.status === 0 };
}

/** Kill all long-running children (server, metro) and free E2E ports. */
export function teardown(): void {
  log("teardown: stopping server + metro");
  for (const c of children) {
    try { c.kill("SIGTERM"); } catch { /* noop */ }
  }
  // `script`/Expo and a wedged Maestro driver can outlive their tracked parent;
  // free the dedicated E2E ports and kill leftover driver procs so the next run
  // starts clean. Never touches the developer's :3000 dev server.
  freeStalePorts();
  spawnSync("pkill", ["-9", "-f", "maestro-driver-iosUITests-Runner"], { stdio: "ignore" });
}

export { APP_ID };
