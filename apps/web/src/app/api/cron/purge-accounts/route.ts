import { NextResponse } from "next/server";
import { purgeExpiredAccounts } from "@/lib/account-deletion";

/**
 * Scheduled hard-delete of accounts whose HIPAA retention window has elapsed.
 * Wired in vercel.json but a genuine no-op until accounts age past `purgeAfter`
 * (years out). Guarded by CRON_SECRET — Vercel Cron sends it as a Bearer header
 * when the env var is set.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { purged } = await purgeExpiredAccounts();
  return NextResponse.json({ purged });
}
