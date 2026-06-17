/**
 * CDP console capture for the E2E harness.
 *
 * On React Native 0.76 (New Architecture), warning *content* (console.warn /
 * console.error / React dev warnings) is routed to the JS debugger over the
 * Chrome DevTools Protocol and only a "Open debugger to view warnings."
 * placeholder is shown in LogBox / exposed to JS. So neither the in-app console
 * forwarder nor LogBoxData can see the real text.
 *
 * This script acts as that debugger: it polls Metro's inspector target list,
 * connects to each React Native page over CDP, enables the Runtime + Log
 * domains, and appends every console message (Runtime.consoleAPICalled) and log
 * entry (Log.entryAdded) to a file the harness greps after the run. Run via bun:
 *   bun e2e/cdpCapture.ts            # writes /tmp/veladon-e2e-cdp.log
 *
 * Long-lived: the harness spawns it as a tracked child and kills it at teardown.
 * It reconnects automatically as the app relaunches between journeys.
 */
import { appendFileSync, writeFileSync } from "node:fs";
import { METRO_PORT } from "./config";

const METRO = `http://localhost:${METRO_PORT}`;
const OUT = "/tmp/veladon-e2e-cdp.log";
const connected = new Set<string>();

function log(line: string): void {
  try { appendFileSync(OUT, `${line}\n`); } catch { /* noop */ }
}

type Target = { id?: string; title?: string; description?: string; webSocketDebuggerUrl?: string };

async function listTargets(): Promise<Target[]> {
  for (const path of ["/json/list", "/json"]) {
    try {
      const res = await fetch(`${METRO}${path}`);
      if (!res.ok) continue;
      const data = (await res.json()) as Target[];
      if (Array.isArray(data) && data.length) return data;
    } catch { /* try next */ }
  }
  return [];
}

// eslint-disable-next-line no-control-regex
const ANSI = /\[[0-9;]*m/g;
const stripAnsi = (s: string): string => s.replace(ANSI, "");

/** Flatten a CDP RemoteObject arg to a readable string. */
function argToString(a: Record<string, unknown>): string {
  if (a == null) return "";
  if (typeof a.value === "string") return stripAnsi(a.value);
  if (a.value !== undefined) return String(a.value);
  if (typeof a.description === "string") return stripAnsi(a.description);
  if (a.unserializableValue !== undefined) return String(a.unserializableValue);
  try { return JSON.stringify(a.preview ?? a); } catch { return String(a); }
}

function connect(wsUrl: string, label: string): void {
  if (connected.has(wsUrl)) return;
  connected.add(wsUrl);
  let ws: WebSocket;
  try { ws = new WebSocket(wsUrl); } catch { connected.delete(wsUrl); return; }
  let nextId = 1;

  ws.onopen = () => {
    log(`[cdp] connected: ${label}`);
    ws.send(JSON.stringify({ id: nextId++, method: "Runtime.enable" }));
    ws.send(JSON.stringify({ id: nextId++, method: "Log.enable" }));
  };
  ws.onmessage = (ev: MessageEvent) => {
    try {
      const m = JSON.parse(String(ev.data)) as {
        method?: string;
        params?: { type?: string; args?: Record<string, unknown>[]; entry?: { level?: string; text?: string } };
      };
      if (m.method === "Runtime.consoleAPICalled") {
        const type = String(m.params?.type ?? "log").toUpperCase();
        const text = (m.params?.args ?? []).map(argToString).join(" ");
        log(`[CDP ${type}] ${text}`);
      } else if (m.method === "Log.entryAdded") {
        const e = m.params?.entry;
        log(`[CDP LOG ${String(e?.level ?? "").toUpperCase()}] ${e?.text ?? ""}`);
      }
    } catch { /* ignore non-JSON / unexpected frames */ }
  };
  ws.onclose = () => { connected.delete(wsUrl); };
  ws.onerror = () => { connected.delete(wsUrl); };
}

async function main(): Promise<void> {
  writeFileSync(OUT, `[cdp] capture started against ${METRO}\n`);
  // Loop forever; the harness kills this child at teardown.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const targets = await listTargets();
    for (const t of targets) {
      if (t.webSocketDebuggerUrl) connect(t.webSocketDebuggerUrl, t.title ?? t.description ?? t.id ?? "page");
    }
    await Bun.sleep(1000);
  }
}

void main();
