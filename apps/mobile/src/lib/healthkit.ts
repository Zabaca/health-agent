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

/**
 * Request HealthKit authorization. Resolves to true when granted, false on
 * non-iOS platforms (Android, web). Rejects if the user explicitly denies.
 */
export function requestHealthKitAccess(): Promise<boolean> {
  if (Platform.OS !== 'ios') return Promise.resolve(false);
  const AppleHealthKit = getAppleHealthKit();
  const perms: HealthKitPermissions = {
    permissions: {
      read: [
        AppleHealthKit.Constants.Permissions.HeartRate,
        AppleHealthKit.Constants.Permissions.StepCount,
        AppleHealthKit.Constants.Permissions.SleepAnalysis,
        AppleHealthKit.Constants.Permissions.BloodGlucose,
        AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
      ],
      write: [],
    },
  };
  return new Promise((resolve, reject) => {
    AppleHealthKit.initHealthKit(perms, (error: string) => {
      if (error) reject(new Error(error));
      else resolve(true);
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

// ─── Clinical records (FHIR) ────────────────────────────────────────────────
// Apple returns these as FHIR (DSTU2/R4). Foreground-only — no background
// delivery for clinical records.
// TODO(fhir): clinical reads need the "Clinical Health Records" capability on
// the App ID (paid Apple Developer Program) + clinical read permissions in
// requestHealthKitAccess() + NSHealthClinicalHealthRecordsShareUsageDescription
// (added to Info.plist). Until enabled, getClinicalRecords errors and this
// returns []. Validate field handling against real provider data on a device.
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
      });
    }
  }
  return out;
}
