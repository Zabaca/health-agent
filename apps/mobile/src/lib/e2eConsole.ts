/**
 * E2E-only console forwarder.
 *
 * Non-interactive Expo/Metro suppresses the streamed device JS console, so the
 * harness can't see app warnings/errors (e.g. the LogBox "Open debugger to view
 * warnings" toast). This forwards them to the test web server's /api/e2e-log
 * sink, which logs them — so they land in the captured web.log for review.
 *
 * Timing: this module is imported first in index.js (before `expo`), but Expo
 * only populates `process.env.EXPO_PUBLIC_*` as a runtime object DURING its own
 * import — and on a cold boot that can land slightly after our first tick. So we
 * POLL until the flag is readable, then install once. We also read the API URL
 * lazily inside post() (after Expo init) and wrap console only after RN's LogBox
 * has installed its own override.
 *
 * No-op in every normal build. Fire-and-forget and fully guarded.
 */
function post(level: string, message: string): void {
  try {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
    void fetch(`${apiUrl}/api/e2e-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, message }),
    }).catch(() => {});
  } catch {
    /* never let logging break the app */
  }
}

function forward(level: "warn" | "error", args: unknown[]): void {
  const message = args
    .map((a) => {
      if (typeof a === "string") return a;
      try { return JSON.stringify(a); } catch { return String(a); }
    })
    .join(" ");
  post(level, message);
}

/**
 * Tap React Native's LogBox data store. Some RN warnings are raised through
 * LogBox WITHOUT passing through JS console.warn, so the console patch can't see
 * them. LogBoxData.observe fires whenever the log set changes; dedupe + forward.
 */
function observeLogBox(): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const LogBoxData = require("react-native/Libraries/LogBox/Data/LogBoxData");
    const seen = new Set<string>();
    LogBoxData.observe((state: { logs?: Iterable<unknown> }) => {
      for (const lg of Array.from(state?.logs ?? [])) {
        const log = lg as { level?: string; category?: string; message?: { content?: string } };
        const content = log?.message?.content ?? log?.category ?? "";
        if (!content) continue;
        const level = log?.level === "error" || log?.level === "fatal" ? "error" : "warn";
        const key = `${level}:${content}`;
        if (seen.has(key)) continue;
        seen.add(key);
        post(level, `[LogBox] ${content}`);
      }
    });
  } catch (e) {
    post("error", `[e2e-diag] LogBoxData require failed: ${String(e)}`);
  }
}

function install(): void {
  post("info", "[e2e-diag] forwarder online");
  const sink = console as unknown as Record<string, (...args: unknown[]) => void>;
  for (const level of ["warn", "error"] as const) {
    const orig = console[level].bind(console);
    sink[level] = (...args: unknown[]) => {
      forward(level, args);
      orig(...args);
    };
  }
  observeLogBox();
}

// Poll until Expo has populated process.env.EXPO_PUBLIC_E2E (cold-boot race),
// then install once. In a normal build the flag never becomes "1", so this just
// ticks a handful of times and stops — negligible and fully inert.
let attempts = 0;
function tryInstall(): void {
  if (process.env.EXPO_PUBLIC_E2E === "1") { install(); return; }
  if (attempts++ < 30) setTimeout(tryInstall, 100);
}
setTimeout(tryInstall, 0);

export {};
