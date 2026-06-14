// scripts/seed-health-data.ts
// Generate N days of realistic HealthKit telemetry (heart rate, SpO2, steps,
// sleep) for a patient and upsert it into the local DB — mirroring exactly what
// POST /api/health-data writes (source='healthkitTelemetry', encrypted dataBlob,
// idempotent on the (patientId, source, externalId) unique index).
//
// Usage (run from apps/web so Bun loads apps/web/.env):
//   cd apps/web && bun run scripts/seed-health-data.ts [email] [days]
//   defaults: email=foureight84@gmail.com  days=35

import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "../src/lib/db";
import { incomingFiles, users } from "../src/lib/db/schema";
import { encrypt } from "../src/lib/crypto";

const TELEMETRY_SOURCE = "healthkitTelemetry";

const email = process.argv[2] ?? "foureight84@gmail.com";
const days = Number(process.argv[3] ?? 35);

type Rec = { type: string; date: string; value: number; unit: string };

// ── deterministic-ish noise helpers (a little variation, no external deps) ──
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.round(rand(min, max));

/** YYYY-MM-DD for `offset` days before today (local time). */
function dateStr(offset: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - offset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Realistic correlated daily aggregates for one day. */
function dayRecords(date: string, dayIndex: number): Rec[] {
  // Resting heart rate drifts gently across the month via a slow sine, plus noise.
  const hrAvg = Math.round(68 + 6 * Math.sin(dayIndex / 5) + rand(-3, 3)); // ~62–78 bpm
  const hrMin = hrAvg - randInt(8, 16); // overnight low
  const hrMax = hrAvg + randInt(32, 58); // exertion peak

  // SpO2 sits high and tight.
  const spo2Avg = randInt(96, 99);
  const spo2Min = Math.min(spo2Avg - randInt(1, 3), 96);
  const spo2Max = Math.min(spo2Avg + randInt(0, 2), 100);

  // Steps — weekends (Sat/Sun) tend lower, weekdays higher, all noisy.
  const dow = new Date(`${date}T12:00:00`).getDay();
  const weekend = dow === 0 || dow === 6;
  const steps = randInt(weekend ? 2500 : 5000, weekend ? 9000 : 14000);

  // Sleep — 6h–8.5h in minutes.
  const sleepMinutes = randInt(360, 510);

  return [
    { type: "steps", date, value: steps, unit: "count" },
    { type: "heartRateAvg", date, value: hrAvg, unit: "bpm" },
    { type: "heartRateMin", date, value: hrMin, unit: "bpm" },
    { type: "heartRateMax", date, value: hrMax, unit: "bpm" },
    { type: "spo2Avg", date, value: spo2Avg, unit: "%" },
    { type: "spo2Min", date, value: spo2Min, unit: "%" },
    { type: "spo2Max", date, value: spo2Max, unit: "%" },
    { type: "sleepMinutes", date, value: sleepMinutes, unit: "min" },
  ];
}

async function main() {
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    console.error(`No user found with email ${email}. Aborting (this script does not create users).`);
    process.exit(1);
  }
  const userId = user.id;

  // Oldest → newest so dayIndex 0 is the oldest day.
  const records: Rec[] = [];
  for (let i = days - 1; i >= 0; i--) {
    records.push(...dayRecords(dateStr(i), days - 1 - i));
  }

  const now = new Date().toISOString();
  const rows = records.map((r) => ({
    id: randomUUID(),
    patientId: userId,
    source: TELEMETRY_SOURCE,
    fileURL: "",
    fileType: "healthkit/telemetry",
    type: r.type,
    time: r.date,
    dataBlob: encrypt(JSON.stringify({ value: r.value, unit: r.unit, source: "seed-script" })),
    externalId: `${r.type}:${r.date}`,
    createdAt: now,
    updatedAt: now,
  }));

  // Batch to stay well under SQLite's bound-variable ceiling.
  const BATCH = 100;
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    await db
      .insert(incomingFiles)
      .values(chunk)
      .onConflictDoUpdate({
        target: [incomingFiles.patientId, incomingFiles.source, incomingFiles.externalId],
        set: {
          dataBlob: sql`excluded."dataBlob"`,
          time: sql`excluded."time"`,
          updatedAt: now,
        },
      });
  }

  console.log(
    `Seeded ${rows.length} telemetry rows (${days} days × 8 metrics) for ${email} [${user.id}].`,
  );
  console.log(`Date range: ${dateStr(days - 1)} → ${dateStr(0)}`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
