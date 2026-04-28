export type Metric = "heartRate" | "sleep" | "glucose" | "steps";

export const metricLabels: Record<Metric, string> = {
  heartRate: "HEART RATE",
  sleep: "SLEEP",
  glucose: "GLUCOSE",
  steps: "STEPS",
};

export const dashboardMetrics = {
  heartRate: { value: "72", unit: "bpm", status: "Normal", statusTone: "good" as const },
  sleep: {
    value: "7h 22m",
    unit: "last night",
    status: "Good +12 min",
    statusTone: "good" as const,
  },
  glucose: { value: "94", unit: "mg/dL", status: "Optimal", statusTone: "good" as const },
  steps: { value: "6,841", unit: "today", status: "68% of goal", statusTone: "warn" as const },
};

export const heartRateChart = {
  bars: [50, 65, 55, 78, 60, 72, 68, 90, 70, 75, 60, 80],
  selected: 5,
  min: 58,
  avg: 72,
  max: 94,
};

export const sleepChart = {
  bars: [55, 60, 50, 90, 65, 75, 70, 80, 55, 60, 70, 65],
  selected: 3,
  total: "7h 22m",
  deep: "1h 45m",
  rem: "1h 20m",
};

export const glucoseChart = {
  bars: [40, 55, 65, 50, 70, 45, 80, 60, 100, 70, 55, 65],
  selected: 8,
  min: 82,
  avg: 94,
  max: 107,
};

export const stepsChart = {
  bars: [45, 60, 55, 70, 90, 40, 35],
  labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  selected: 4,
  goal: "10k",
  distance: "4.2 mi",
  active: "38 min",
};

export const accountSetupSteps = [
  { id: "apple-health", label: "Connect Apple Health", complete: false },
  { id: "profile", label: "Complete your profile", complete: false },
  { id: "provider", label: "Add a health provider", complete: false },
  { id: "release", label: "Create your first release", complete: false },
];
