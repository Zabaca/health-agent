import { Platform } from 'react-native';

/**
 * Dev-only HealthKit mock.
 *
 * The iOS simulator's HealthKit store only ever holds whatever you manually add
 * (usually just "today"), so the Week/Month charts look empty. This module feeds
 * synthetic samples into the SAME read path the app already uses
 * (`getAppleHealthKit().get*Samples`), shaped EXACTLY like react-native-health's
 * native responses, so the charts render as they would on a real device with a
 * full history.
 *
 * Shapes mirror the compiled Obj-C (react-native-health 1.19.0):
 *   - quantity samples (heart rate, SpO2, steps):
 *       { id, value:number, startDate:ISO, endDate:ISO, sourceName, sourceId }
 *   - sleep category samples:
 *       { id, value:'CORE'|'DEEP'|'REM'|'AWAKE'|'INBED'|'ASLEEP', startDate, endDate, sourceName, sourceId }
 *   - SpO2 `value` is a 0–1 FRACTION (HealthKit reports it that way; the app
 *     normalizes `v <= 1.5 ? v*100`).
 *
 * Toggle below. Guarded by __DEV__ so a production build (where __DEV__ is
 * false) can NEVER serve mock data, regardless of this flag.
 */
const MOCK_ENABLED = false;

export function isHealthKitMockEnabled(): boolean {
  return __DEV__ && MOCK_ENABLED && Platform.OS === 'ios';
}

// ─── sample shape ───────────────────────────────────────────────────────────
type Sample = {
  id: string;
  value: number | string;
  startDate: string;
  endDate: string;
  sourceName: string;
  sourceId: string;
};

const WATCH = { sourceName: 'Apple Watch', sourceId: 'com.apple.health.mock.watch' };
const PHONE = { sourceName: 'iPhone', sourceId: 'com.apple.health.mock.phone' };

let idCounter = 0;
function mk(value: number | string, start: Date, end: Date, src: { sourceName: string; sourceId: string }): Sample {
  return {
    id: `mock-${(idCounter++).toString(16).padStart(8, '0')}`,
    value,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    sourceName: src.sourceName,
    sourceId: src.sourceId,
  };
}

// ─── deterministic per-day RNG (so Today/Week/Month agree) ──────────────────
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Stable seed for a given calendar day + per-metric salt. */
function dayRng(day: Date, salt: number): () => number {
  const key = (day.getFullYear() * 10000 + (day.getMonth() + 1) * 100 + day.getDate()) * 37 + salt;
  return mulberry32(key >>> 0);
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Local timestamp on `day` at hour:minute (round-trips through new Date() in local tz). */
function at(day: Date, hour: number, minute = 0): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
}

/** Iterate each local calendar day in [start, end] inclusive. */
function* eachDay(start: Date, end: Date): Generator<Date> {
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur.getTime() <= last.getTime()) {
    yield new Date(cur);
    cur.setDate(cur.getDate() + 1);
  }
}

function inWindow(s: Sample, start: Date, end: Date): boolean {
  const t = new Date(s.startDate).getTime();
  return t >= start.getTime() && t <= end.getTime();
}

// ─── per-metric generators ──────────────────────────────────────────────────

/** Intraday step samples (active hours 6:00–22:00) summing to a daily total. */
function genSteps(start: Date, end: Date): Sample[] {
  const out: Sample[] = [];
  for (const day of eachDay(start, end)) {
    const rng = dayRng(day, 1);
    const dow = day.getDay();
    const weekend = dow === 0 || dow === 6;
    const total = Math.round(lerp(weekend ? 2500 : 6500, weekend ? 9000 : 14000, rng()));
    // Two activity humps (morning ~8a, evening ~6p) + a flat baseline.
    const hours: { h: number; w: number }[] = [];
    let wsum = 0;
    for (let h = 6; h <= 22; h++) {
      const shape = Math.exp(-((h - 8) ** 2) / 8) + Math.exp(-((h - 18) ** 2) / 10) + 0.3;
      const w = shape * (0.6 + 0.8 * rng());
      hours.push({ h, w });
      wsum += w;
    }
    for (const { h, w } of hours) {
      const v = Math.round((total * w) / wsum);
      if (v <= 0) continue;
      out.push(mk(v, at(day, h, 0), at(day, h, 59), PHONE));
    }
  }
  return out.filter((s) => inWindow(s, start, end));
}

/** Heart-rate samples every 30 min with a diurnal curve (overnight dip, daytime rise). */
function genHeartRate(start: Date, end: Date): Sample[] {
  const out: Sample[] = [];
  for (const day of eachDay(start, end)) {
    const rng = dayRng(day, 2);
    const resting = lerp(56, 64, rng());
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 30]) {
        let diurnal: number;
        if (h < 6) diurnal = -6 + rng() * 4; // overnight low
        else if (h < 9) diurnal = 8 + rng() * 10; // waking
        else if (h < 18) diurnal = 12 + rng() * 18; // active day
        else if (h < 22) diurnal = 6 + rng() * 12; // evening
        else diurnal = -2 + rng() * 6; // wind-down
        const v = Math.round(clamp(resting + diurnal + (rng() * 6 - 3), 46, 150));
        const ts = at(day, h, m);
        out.push(mk(v, ts, ts, WATCH));
      }
    }
  }
  return out.filter((s) => inWindow(s, start, end));
}

/** SpO2 samples every 2h as a 0–1 fraction (mostly 0.96–0.98, rare dips). */
function genSpo2(start: Date, end: Date): Sample[] {
  const out: Sample[] = [];
  for (const day of eachDay(start, end)) {
    const rng = dayRng(day, 3);
    for (let h = 0; h < 24; h += 2) {
      const dip = rng() < 0.1 ? 0.02 : 0;
      const frac = clamp(0.95 + rng() * 0.04 - dip, 0.92, 1);
      const ts = at(day, h, 15);
      out.push(mk(Number(frac.toFixed(3)), ts, ts, WATCH));
    }
  }
  return out.filter((s) => inWindow(s, start, end));
}

/**
 * One night of sleep per day, placed in that day's early morning so every
 * segment shares the same calendar date (the app buckets sleep by each sample's
 * own startDate day). Stage segments cycle Core→Deep→Core→REM with occasional
 * brief awakenings, accumulating to a nightly asleep target.
 */
function genSleep(start: Date, end: Date): Sample[] {
  const out: Sample[] = [];
  for (const day of eachDay(start, end)) {
    const rng = dayRng(day, 4);
    const target = Math.round(lerp(360, 470, rng())); // asleep minutes (6h–7h50)
    let t = at(day, 0, 5 + Math.round(rng() * 30)); // sleep onset ~00:05–00:35
    let asleep = 0;
    const cycle = ['CORE', 'DEEP', 'CORE', 'REM'] as const;
    let ci = 0;
    // Guard against runaway loops; a night is at most ~20 segments.
    while (asleep < target && ci < 40) {
      const stage = cycle[ci % cycle.length];
      ci++;
      let len: number;
      if (stage === 'DEEP') len = 20 + Math.round(rng() * 25);
      else if (stage === 'REM') len = 15 + Math.round(rng() * 25);
      else len = 30 + Math.round(rng() * 30); // CORE
      if (rng() < 0.15) {
        // brief awakening between cycles
        const aEnd = new Date(t.getTime() + (3 + Math.round(rng() * 6)) * 60000);
        out.push(mk('AWAKE', t, aEnd, WATCH));
        t = aEnd;
      }
      const segEnd = new Date(t.getTime() + len * 60000);
      out.push(mk(stage, t, segEnd, WATCH));
      asleep += len;
      t = segEnd;
    }
  }
  return out.filter((s) => inWindow(s, start, end));
}

// ─── module wrapper ─────────────────────────────────────────────────────────

type Cb = (err: unknown, results: Sample[]) => void;
type Opts = { startDate?: string; endDate?: string; limit?: number; ascending?: boolean };

function respond(opts: Opts, cb: Cb, gen: (start: Date, end: Date) => Sample[]): void {
  try {
    const start = opts.startDate ? new Date(opts.startDate) : new Date(Date.now() - 86400000);
    const end = opts.endDate ? new Date(opts.endDate) : new Date();
    let data = gen(start, end);
    if (opts.ascending === false) data = data.slice().reverse();
    if (typeof opts.limit === 'number' && opts.limit > 0) data = data.slice(0, opts.limit);
    cb(null, data);
  } catch (e) {
    cb(String(e), []);
  }
}

/**
 * Wrap the real react-native-health module so the four `get*Samples` reads the
 * charts use return mock data, while everything else (Constants, initHealthKit,
 * clinical record reads, saves) passes straight through to the native module.
 */
export function wrapWithMock<T extends object>(real: T): T {
  const overrides: Record<string, (opts: Opts, cb: Cb) => void> = {
    getDailyStepCountSamples: (opts, cb) => respond(opts, cb, genSteps),
    getHeartRateSamples: (opts, cb) => respond(opts, cb, genHeartRate),
    getOxygenSaturationSamples: (opts, cb) => respond(opts, cb, genSpo2),
    getSleepSamples: (opts, cb) => respond(opts, cb, genSleep),
  };
  return new Proxy(real, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && prop in overrides) return overrides[prop];
      return Reflect.get(target, prop, receiver);
    },
  });
}
