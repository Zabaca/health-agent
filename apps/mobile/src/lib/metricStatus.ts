// Shared metric status thresholds. Used by BOTH the Dashboard cards and the
// expanded views so a value can never read "Normal" on the collapsed card but
// "Elevated" once expanded (the card previously hard-coded its status).

export type StatusTone = "good" | "warn";
export type MetricStatus = { label: string; tone: StatusTone };

const NO_DATA: MetricStatus = { label: "No data", tone: "warn" };

/** Heart rate (bpm) — based on the average. */
export function heartRateStatus(avg: number | null | undefined): MetricStatus {
  if (avg == null) return NO_DATA;
  if (avg < 60) return { label: "Low", tone: "warn" };
  if (avg > 100) return { label: "Elevated", tone: "warn" };
  return { label: "Normal", tone: "good" };
}

/** Blood oxygen saturation (%) — based on the average. Normal is 95–100%. */
export function spo2Status(avg: number | null | undefined): MetricStatus {
  if (avg == null) return NO_DATA;
  if (avg < 90) return { label: "Low", tone: "warn" };
  if (avg < 95) return { label: "Borderline", tone: "warn" };
  return { label: "Normal", tone: "good" };
}

/** Sleep (minutes asleep). 0 / null is treated as no data. */
export function sleepStatus(minutes: number | null | undefined): MetricStatus {
  if (minutes == null || minutes === 0) return NO_DATA;
  if (minutes < 360) return { label: "Short", tone: "warn" };
  if (minutes > 540) return { label: "Long", tone: "warn" };
  return { label: "Good", tone: "good" };
}
