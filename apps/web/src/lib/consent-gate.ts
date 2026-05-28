import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { patientDesignatedAgents } from "@/lib/db/schema";

/**
 * Whether a user is exempt from the onboarding consent + 18+ age gate because
 * they hold an accepted PDA relation (the inviting adult's invitation is proof
 * of consent, and a represented minor is allowed).
 *
 * MUST be read from the DB, not the JWT `isPda` flag: that flag goes stale when
 * a user accepts a PDA invite mid-session, so both the consent gate (layout)
 * and the enforcement route (POST /api/consent) read it from here to stay in
 * lockstep — otherwise a freshly-invited PDA-minor could be hard-deleted.
 */
export async function isPdaExempt(userId: string): Promise<boolean> {
  const relation = await db.query.patientDesignatedAgents.findFirst({
    where: and(
      eq(patientDesignatedAgents.agentUserId, userId),
      eq(patientDesignatedAgents.status, "accepted"),
    ),
    columns: { id: true },
  });
  return !!relation;
}
