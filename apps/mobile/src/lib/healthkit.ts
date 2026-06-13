import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type {
  HealthKitPermissions,
  HealthValue,
  HealthInputOptions,
} from 'react-native-health';

export type HealthRecord = {
  type: string;
  date: string;
  value: number;
  unit: string;
  source?: string;
};

// Persisted timestamp of the last sync *attempt* (independent of whether data
// was found). Lets the UI distinguish "synced, no data" from "never synced".
const LAST_SYNC_KEY = 'lastHealthSyncAt';

export async function recordHealthSync(): Promise<void> {
  try {
    await SecureStore.setItemAsync(LAST_SYNC_KEY, new Date().toISOString());
  } catch {
    // Non-fatal — the timestamp is only informational.
  }
}

export async function getLastHealthSync(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(LAST_SYNC_KEY);
  } catch {
    return null;
  }
}

export async function clearHealthSync(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(LAST_SYNC_KEY);
  } catch {
    // Non-fatal.
  }
}

/** Local-timezone date string for today: "2026-05-21" */
function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfDayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function endOfDayISO(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAppleHealthKit(): any {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('react-native-health');
  // react-native-health is CommonJS (`module.exports = HealthKit`), so there is
  // no `.default`; fall back to the module itself for ESM-interop builds.
  return mod.default ?? mod;
}

/** Extract a human-readable message from react-native-health's native error
 *  callback, which may hand back a string OR an object. `new Error(obj)`
 *  stringifies to "[object Object]", so normalize before surfacing to the UI. */
function nativeErrMessage(e: unknown): string {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string' && m) return m;
    try {
      const s = JSON.stringify(e);
      if (s && s !== '{}') return s;
    } catch {
      /* non-serializable — fall through */
    }
  }
  return 'Apple Health authorization failed.';
}

// Core, account-free metrics (no provider account required) plus clinical
// (FHIR) record types. Requested together in a single initHealthKit call —
// presenting a second authorization sheet right after the first one dismisses
// deadlocks on iOS (the completion handler never fires), so do NOT split this.
const CORE_READ_PERMS = [
  'HeartRate',
  'StepCount',
  'SleepAnalysis',
  'BloodGlucose',
  'ActiveEnergyBurned',
] as const;

/**
 * Request HealthKit authorization. Resolves false on non-iOS; otherwise always
 * resolves true once the authorization sheet is dismissed.
 *
 * Core metrics only by default — pass `{ clinical: true }` to also request the
 * clinical (FHIR) record types. Clinical access presents Apple's "Share Health
 * Records" account-linking sheet, so it must be reserved for explicit user
 * actions (Connect / Re-authorize). Background/silent re-inits (e.g. the
 * dashboard) must omit it, or the sheet re-appears on every visit.
 *
 * An init error is treated as NON-FATAL: HealthKit never reliably reports
 * read-permission denial (Apple's privacy model), and dismissing the "Share
 * Health Records" sheet with no linked provider account surfaces here as an
 * error too. Neither should fail the connection — core metric reads still work
 * and clinical reads degrade to empty. We log and resolve rather than reject so
 * a missing provider account can't break Apple Health entirely.
 */
export function requestHealthKitAccess(
  opts: { clinical?: boolean } = {},
): Promise<boolean> {
  if (Platform.OS !== 'ios') return Promise.resolve(false);
  const AppleHealthKit = getAppleHealthKit();
  const types = opts.clinical ? [...CORE_READ_PERMS, ...CLINICAL_TYPES] : [...CORE_READ_PERMS];
  const perms: HealthKitPermissions = {
    permissions: {
      read: types.map((k) => AppleHealthKit.Constants.Permissions[k]),
      write: [],
    },
  };
  return new Promise((resolve) => {
    AppleHealthKit.initHealthKit(perms, (error: unknown) => {
      if (error) {
        const msg = nativeErrMessage(error);
        // HKErrorCode 7 = user canceled (e.g. dismissed the "Share Health
        // Records" sheet) — a normal outcome, not worth surfacing. Only warn on
        // genuine errors.
        if (!/Code=7|cancel/i.test(msg)) {
          // eslint-disable-next-line no-console
          console.warn('[healthkit] init returned a non-fatal error:', msg);
        }
      }
      resolve(true);
    });
  });
}

function promiseSamples<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (opts: HealthInputOptions, cb: (err: string, results: T) => void) => void,
  opts: HealthInputOptions,
): Promise<T | null> {
  return new Promise((resolve) => {
    fn(opts, (err, results) => {
      if (err) resolve(null);
      else resolve(results);
    });
  });
}

/**
 * Fetch today's daily aggregate health metrics from HealthKit.
 * Returns an empty array on non-iOS platforms or if HealthKit returns no data.
 */
export async function fetchTodayMetrics(): Promise<HealthRecord[]> {
  if (Platform.OS !== 'ios') return [];

  const AppleHealthKit = getAppleHealthKit();
  const date = todayStr();
  const startDate = startOfDayISO();
  const endDate = endOfDayISO();
  const records: HealthRecord[] = [];

  // Steps — daily buckets summed for the day. getDailyStepCountSamples honors
  // the date range, unlike getStepCount which reads a single `date` option.
  const stepSamples = await promiseSamples<HealthValue[]>(
    AppleHealthKit.getDailyStepCountSamples.bind(AppleHealthKit),
    { startDate, endDate },
  );
  if (stepSamples && stepSamples.length > 0) {
    const total = stepSamples.reduce((sum, s) => sum + s.value, 0);
    if (total > 0) {
      records.push({ type: 'steps', date, value: Math.round(total), unit: 'count' });
    }
  }

  // Heart rate — avg / min / max from samples
  const hrSamples = await promiseSamples<HealthValue[]>(
    AppleHealthKit.getHeartRateSamples.bind(AppleHealthKit),
    { startDate, endDate, ascending: true, limit: 500 },
  );
  if (hrSamples && hrSamples.length > 0) {
    const values = hrSamples.map((s) => s.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    records.push(
      { type: 'heartRateAvg', date, value: Math.round(avg), unit: 'bpm' },
      { type: 'heartRateMin', date, value: Math.min(...values), unit: 'bpm' },
      { type: 'heartRateMax', date, value: Math.max(...values), unit: 'bpm' },
    );
  }

  // Sleep — sum of asleep intervals in minutes.
  // react-native-health returns value as "INBED" | "ASLEEP" | "ASLEEPCORE" |
  // "ASLEEPDEEP" | "ASLEEPREM" | "AWAKE" despite the TS type saying `number`.
  const sleepSamples = await promiseSamples<HealthValue[]>(
    AppleHealthKit.getSleepSamples.bind(AppleHealthKit),
    { startDate, endDate, ascending: true, limit: 200 },
  );
  if (sleepSamples && sleepSamples.length > 0) {
    let totalMin = 0;
    for (const s of sleepSamples) {
      const val = s.value as unknown as string;
      if (val === 'ASLEEP' || val === 'ASLEEPCORE' || val === 'ASLEEPDEEP' || val === 'ASLEEPREM') {
        const ms = new Date(s.endDate).getTime() - new Date(s.startDate).getTime();
        totalMin += ms / 60000;
      }
    }
    if (totalMin > 0) {
      records.push({ type: 'sleepMinutes', date, value: Math.round(totalMin), unit: 'min' });
    }
  }

  // Blood glucose — request in mg/dL (US standard)
  const glucoseSamples = await promiseSamples<HealthValue[]>(
    AppleHealthKit.getBloodGlucoseSamples.bind(AppleHealthKit),
    { startDate, endDate, ascending: true, limit: 100, unit: 'mgPerdL' as never },
  );
  if (glucoseSamples && glucoseSamples.length > 0) {
    const values = glucoseSamples.map((s) => s.value);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    records.push(
      { type: 'glucoseAvg', date, value: Math.round(avg), unit: 'mg/dL' },
      { type: 'glucoseMin', date, value: Math.min(...values), unit: 'mg/dL' },
      { type: 'glucoseMax', date, value: Math.max(...values), unit: 'mg/dL' },
    );
  }

  return records;
}

// ─── Time-series for expanded views ─────────────────────────────────────────
// Each metric returns bars + summary stats. "today" = intra-day buckets (hourly
// for vitals, single value for sleep). "week"/"month" = daily buckets.

export type MetricRange = 'today' | 'week' | 'month';

export type MetricSeries = {
  bars: number[];           // raw values; chart normalizes
  labels: string[];         // x-axis labels matching bars
  selectedIndex: number;    // bar to highlight (latest non-empty by default)
  summary: {
    primary: number | null; // headline value (avg or total)
    min: number | null;
    max: number | null;
    unit: string;
  };
};

function emptySeries(unit: string): MetricSeries {
  return { bars: [], labels: [], selectedIndex: -1, summary: { primary: null, min: null, max: null, unit } };
}

function dayLabel(d: Date): string {
  return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function rangeBounds(range: MetricRange): { start: Date; end: Date; days: number } {
  const end = new Date();
  const start = startOfDay(end);
  if (range === 'today') return { start, end, days: 1 };
  const days = range === 'week' ? 7 : 30;
  start.setDate(start.getDate() - (days - 1));
  return { start, end, days };
}

/** Sum samples falling into N equal time buckets across [start, end]. */
function bucketBySum(samples: { startDate: string; value: number }[], start: Date, end: Date, n: number): number[] {
  const bars = new Array(n).fill(0);
  const span = end.getTime() - start.getTime();
  if (span <= 0) return bars;
  for (const s of samples) {
    const t = new Date(s.startDate).getTime();
    if (t < start.getTime() || t > end.getTime()) continue;
    const idx = Math.min(n - 1, Math.floor(((t - start.getTime()) / span) * n));
    bars[idx] += s.value;
  }
  return bars;
}

/** Average samples falling into N equal time buckets; 0 when bucket empty. */
function bucketByAvg(samples: { startDate: string; value: number }[], start: Date, end: Date, n: number): number[] {
  const sums = new Array(n).fill(0);
  const counts = new Array(n).fill(0);
  const span = end.getTime() - start.getTime();
  if (span <= 0) return sums;
  for (const s of samples) {
    const t = new Date(s.startDate).getTime();
    if (t < start.getTime() || t > end.getTime()) continue;
    const idx = Math.min(n - 1, Math.floor(((t - start.getTime()) / span) * n));
    sums[idx] += s.value;
    counts[idx] += 1;
  }
  return sums.map((sum, i) => counts[i] ? sum / counts[i] : 0);
}

function lastNonZero(bars: number[]): number {
  for (let i = bars.length - 1; i >= 0; i--) if (bars[i] > 0) return i;
  return bars.length - 1;
}

function todayHourlyLabels(): string[] {
  // 12 two-hour buckets across the day → "12a","2a"…"10p"
  return ['12a','2a','4a','6a','8a','10a','12p','2p','4p','6p','8p','10p'];
}

function dailyLabels(start: Date, days: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(days <= 7 ? dayLabel(d) : String(d.getDate()));
  }
  return out;
}

export async function fetchStepsSeries(range: MetricRange): Promise<MetricSeries> {
  if (Platform.OS !== 'ios') return emptySeries('count');
  const AppleHealthKit = getAppleHealthKit();
  const { start, end, days } = rangeBounds(range);
  const samples = await promiseSamples<HealthValue[]>(
    AppleHealthKit.getDailyStepCountSamples.bind(AppleHealthKit),
    { startDate: start.toISOString(), endDate: end.toISOString() },
  );
  if (!samples || samples.length === 0) return emptySeries('count');

  if (range === 'today') {
    const bars = bucketBySum(samples, start, end, 12).map(Math.round);
    const total = bars.reduce((a, b) => a + b, 0);
    return {
      bars,
      labels: todayHourlyLabels(),
      selectedIndex: lastNonZero(bars),
      summary: { primary: total, min: total > 0 ? Math.min(...bars.filter(b => b > 0)) : null, max: total > 0 ? Math.max(...bars) : null, unit: 'count' },
    };
  }

  // Week / Month: one bar per day.
  const bars = new Array(days).fill(0);
  for (const s of samples) {
    const idx = Math.floor((new Date(s.startDate).getTime() - start.getTime()) / 86400000);
    if (idx >= 0 && idx < days) bars[idx] += s.value;
  }
  const rounded = bars.map(Math.round);
  const nonZero = rounded.filter(b => b > 0);
  return {
    bars: rounded,
    labels: dailyLabels(start, days),
    selectedIndex: lastNonZero(rounded),
    summary: {
      primary: nonZero.length ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length) : null,
      min: nonZero.length ? Math.min(...nonZero) : null,
      max: nonZero.length ? Math.max(...nonZero) : null,
      unit: 'count',
    },
  };
}

export async function fetchHeartRateSeries(range: MetricRange): Promise<MetricSeries> {
  if (Platform.OS !== 'ios') return emptySeries('bpm');
  const AppleHealthKit = getAppleHealthKit();
  const { start, end, days } = rangeBounds(range);
  const samples = await promiseSamples<HealthValue[]>(
    AppleHealthKit.getHeartRateSamples.bind(AppleHealthKit),
    { startDate: start.toISOString(), endDate: end.toISOString(), ascending: true, limit: 5000 },
  );
  if (!samples || samples.length === 0) return emptySeries('bpm');

  const n = range === 'today' ? 12 : days;
  const bars = bucketByAvg(samples, start, end, n).map(v => Math.round(v));
  const allValues = samples.map(s => s.value);
  const labels = range === 'today' ? todayHourlyLabels() : dailyLabels(start, days);
  return {
    bars,
    labels,
    selectedIndex: lastNonZero(bars),
    summary: {
      primary: Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length),
      min: Math.round(Math.min(...allValues)),
      max: Math.round(Math.max(...allValues)),
      unit: 'bpm',
    },
  };
}

export async function fetchGlucoseSeries(range: MetricRange): Promise<MetricSeries> {
  if (Platform.OS !== 'ios') return emptySeries('mg/dL');
  const AppleHealthKit = getAppleHealthKit();
  const { start, end, days } = rangeBounds(range);
  const samples = await promiseSamples<HealthValue[]>(
    AppleHealthKit.getBloodGlucoseSamples.bind(AppleHealthKit),
    { startDate: start.toISOString(), endDate: end.toISOString(), ascending: true, limit: 1000, unit: 'mgPerdL' as never },
  );
  if (!samples || samples.length === 0) return emptySeries('mg/dL');

  const n = range === 'today' ? 12 : days;
  const bars = bucketByAvg(samples, start, end, n).map(v => Math.round(v));
  const allValues = samples.map(s => s.value);
  const labels = range === 'today' ? todayHourlyLabels() : dailyLabels(start, days);
  return {
    bars,
    labels,
    selectedIndex: lastNonZero(bars),
    summary: {
      primary: Math.round(allValues.reduce((a, b) => a + b, 0) / allValues.length),
      min: Math.round(Math.min(...allValues)),
      max: Math.round(Math.max(...allValues)),
      unit: 'mg/dL',
    },
  };
}

/** Sleep is per-night: Today shows last night with stage breakdown; Week/Month show
 *  nightly totals in minutes. Stages exposed via the returned `stages` field. */
export type SleepSeries = MetricSeries & {
  stages: { asleepMin: number; deepMin: number; remMin: number; coreMin: number; awakeMin: number };
};

function emptySleepSeries(): SleepSeries {
  return { ...emptySeries('min'), stages: { asleepMin: 0, deepMin: 0, remMin: 0, coreMin: 0, awakeMin: 0 } };
}

export async function fetchSleepSeries(range: MetricRange): Promise<SleepSeries> {
  if (Platform.OS !== 'ios') return emptySleepSeries();
  const AppleHealthKit = getAppleHealthKit();
  const { start, end, days } = rangeBounds(range);
  // For "today" we still pull last night, so widen to 24h before start.
  const queryStart = range === 'today' ? new Date(start.getTime() - 24 * 3600 * 1000) : start;
  const samples = await promiseSamples<HealthValue[]>(
    AppleHealthKit.getSleepSamples.bind(AppleHealthKit),
    { startDate: queryStart.toISOString(), endDate: end.toISOString(), ascending: true, limit: 1000 },
  );
  if (!samples || samples.length === 0) return emptySleepSeries();

  // Bucket samples by their startDate's local calendar day, then sum minutes by stage.
  const stagesByDay = new Map<string, { asleep: number; deep: number; rem: number; core: number; awake: number }>();
  for (const s of samples) {
    const d = new Date(s.startDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const ms = new Date(s.endDate).getTime() - d.getTime();
    const min = ms / 60000;
    const cur = stagesByDay.get(key) ?? { asleep: 0, deep: 0, rem: 0, core: 0, awake: 0 };
    const val = s.value as unknown as string;
    if (val === 'ASLEEP') cur.asleep += min;
    else if (val === 'ASLEEPDEEP') { cur.deep += min; cur.asleep += min; }
    else if (val === 'ASLEEPREM') { cur.rem += min; cur.asleep += min; }
    else if (val === 'ASLEEPCORE') { cur.core += min; cur.asleep += min; }
    else if (val === 'AWAKE') cur.awake += min;
    stagesByDay.set(key, cur);
  }

  if (range === 'today') {
    // Last night = the most recent day with sleep data.
    const keys = [...stagesByDay.keys()].sort();
    const lastKey = keys[keys.length - 1];
    const st = lastKey ? stagesByDay.get(lastKey)! : { asleep: 0, deep: 0, rem: 0, core: 0, awake: 0 };
    return {
      bars: [Math.round(st.asleep)],
      labels: ['Last night'],
      selectedIndex: 0,
      summary: { primary: Math.round(st.asleep), min: null, max: null, unit: 'min' },
      stages: { asleepMin: Math.round(st.asleep), deepMin: Math.round(st.deep), remMin: Math.round(st.rem), coreMin: Math.round(st.core), awakeMin: Math.round(st.awake) },
    };
  }

  const bars = new Array(days).fill(0);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    bars[i] = Math.round(stagesByDay.get(key)?.asleep ?? 0);
  }
  const nonZero = bars.filter(b => b > 0);
  // Stage totals across the whole range.
  const totals = [...stagesByDay.values()].reduce(
    (acc, s) => ({ asleep: acc.asleep + s.asleep, deep: acc.deep + s.deep, rem: acc.rem + s.rem, core: acc.core + s.core, awake: acc.awake + s.awake }),
    { asleep: 0, deep: 0, rem: 0, core: 0, awake: 0 },
  );
  return {
    bars,
    labels: dailyLabels(start, days),
    selectedIndex: lastNonZero(bars),
    summary: {
      primary: nonZero.length ? Math.round(nonZero.reduce((a, b) => a + b, 0) / nonZero.length) : null,
      min: nonZero.length ? Math.min(...nonZero) : null,
      max: nonZero.length ? Math.max(...nonZero) : null,
      unit: 'min',
    },
    stages: {
      asleepMin: Math.round(totals.asleep),
      deepMin: Math.round(totals.deep),
      remMin: Math.round(totals.rem),
      coreMin: Math.round(totals.core),
      awakeMin: Math.round(totals.awake),
    },
  };
}

// ─── Clinical records (FHIR) ────────────────────────────────────────────────
// Apple returns these as FHIR (DSTU2/R4). Foreground-only — no background
// delivery for clinical records.
const CLINICAL_TYPES = [
  'AllergyRecord',
  'ConditionRecord',
  'ImmunizationRecord',
  'LabResultRecord',
  'MedicationRecord',
  'ProcedureRecord',
  'VitalSignRecord',
  'CoverageRecord',
] as const;

export type ClinicalRecordInput = {
  recordType: string;
  fhirResourceId: string;
  resourceType: string;
  displayName?: string;
  effectiveDate?: string;
  fhirRelease?: string;
  fhirVersion?: string;
  fhirData: unknown;
  /** HKSource name — Apple's display string for the source app/integration
   *  (e.g. "MyQuest", "MyChart"). Apple's FHIR JSON typically omits performer
   *  for consumer-sourced records, so this is the only reliable signal. */
  sourceName?: string;
};

/**
 * Fetch FHIR clinical records from the last `sinceDays`. Returns [] on non-iOS
 * or when clinical access isn't granted/enabled.
 */
export async function fetchClinicalRecords(sinceDays = 365): Promise<ClinicalRecordInput[]> {
  if (Platform.OS !== 'ios') return [];
  const AppleHealthKit = getAppleHealthKit();
  const start = new Date();
  start.setDate(start.getDate() - sinceDays);
  const startDate = start.toISOString();
  const out: ClinicalRecordInput[] = [];

  for (const type of CLINICAL_TYPES) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results = await new Promise<any[] | null>((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      AppleHealthKit.getClinicalRecords({ startDate, type }, (err: string, res: any[]) =>
        resolve(err ? null : res),
      );
    });
    if (!results) continue;
    for (const r of results) {
      const fhir = r.fhirData ?? {};
      const fhirResourceId = fhir.id ?? r.id;
      if (!fhirResourceId) continue;
      out.push({
        recordType: type,
        fhirResourceId: String(fhirResourceId),
        resourceType: fhir.resourceType ?? type,
        displayName: r.displayName,
        effectiveDate: fhir.effectiveDateTime ?? fhir.recordedDate ?? fhir.onsetDateTime ?? r.startDate,
        fhirRelease: r.fhirRelease,
        fhirVersion: r.fhirVersion,
        fhirData: fhir,
        sourceName: r.sourceName,
      });
    }
  }
  return out;
}
