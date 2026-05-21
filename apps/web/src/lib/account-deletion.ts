import { db } from "@/lib/db";
import { users, sessions, patientDesignatedAgents, zabacaAgentRoles, incomingFiles } from "@/lib/db/schema";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { decrypt } from "@/lib/crypto";
import { deleteFromR2 } from "@/lib/r2";
import { revokeAppleToken } from "@/lib/apple-secret";

/**
 * HIPAA retention window before a deactivated account is permanently purged.
 * Placeholder default — confirm the exact period with compliance.
 */
export const ACCOUNT_RETENTION_DAYS = 6 * 365;

export type DeleteResult =
  | { ok: true }
  | { ok: false; reason: "forbidden" | "not_found" | "apple_revoke_failed" };

/**
 * Self-service deletion is for consumer accounts only (patients / PDAs, i.e.
 * `type: 'user'` with no agent role). Admin + agent staff are admin-managed —
 * deleting one would cascade patient assignments, so block it here.
 */
async function checkDeletable(
  userId: string,
): Promise<{ user: typeof users.$inferSelect } | { error: "not_found" | "forbidden" }> {
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return { error: "not_found" };
  if (user.type === "admin") return { error: "forbidden" };
  const agentRole = await db.query.zabacaAgentRoles.findFirst({
    where: eq(zabacaAgentRoles.userId, userId),
    columns: { userId: true },
  });
  if (agentRole) return { error: "forbidden" };
  return { user };
}

/**
 * Soft-delete: cut off all access immediately and free the unique login keys,
 * but RETAIN identifiable records for HIPAA (no anonymization). A later cron
 * (purgeExpiredAccounts) hard-deletes once `purgeAfter` passes.
 *
 * `deactivatedAt` is the single source of truth for "deleted" — we intentionally
 * do NOT touch `disabled` (that's the admin suspend/reinstate state). Lockout is
 * enforced by nulling credentials + deleting sessions, not by `disabled`.
 */
export async function deactivateAccount(userId: string): Promise<DeleteResult> {
  const res = await checkDeletable(userId);
  if ("error" in res) return { ok: false, reason: res.error };
  const user = res.user;

  // 1. Apple token revocation (App Store 5.1.1(v)) — do this FIRST and abort the
  //    whole deletion if it fails. Otherwise we'd null `appleRefreshToken` below
  //    and lose the only thing that can revoke the grant, leaving the user
  //    "deleted" in our DB while their Apple grant stays live. All-or-nothing:
  //    nothing is mutated yet, so the user can simply retry.
  if (user.appleRefreshToken) {
    const revoked = await revokeAppleToken(decrypt(user.appleRefreshToken));
    if (!revoked) return { ok: false, reason: "apple_revoke_failed" };
  }
  // 2. Delete the user's own avatar from R2 (best-effort).
  if (user.avatarUrl?.includes("/api/files/")) {
    try {
      await deleteFromR2(user.avatarUrl);
    } catch {
      /* best-effort */
    }
  }
  // 3. Revoke PDA relationships both directions so access is cut immediately
  //    (PDAs of this patient, and this user's own representations).
  await db.update(patientDesignatedAgents).set({ status: "revoked" }).where(eq(patientDesignatedAgents.patientId, userId));
  await db.update(patientDesignatedAgents).set({ status: "revoked" }).where(eq(patientDesignatedAgents.agentUserId, userId));
  // 4. Log out everywhere.
  await db.delete(sessions).where(eq(sessions.userId, userId));
  // 5. Deactivate + free the unique login keys; preserve email for audit.
  // NOTE: deactivatedAt/purgeAfter are stored as ISO-8601 (`toISOString()`) and
  // compared lexicographically in purgeExpiredAccounts — both sides MUST stay in
  // that exact format; never write toUTCString()/date-only into these columns.
  const now = new Date();
  const purgeAfter = new Date(now.getTime() + ACCOUNT_RETENTION_DAYS * 86_400_000);
  await db
    .update(users)
    .set({
      deletedEmail: user.email,
      email: null,
      appleId: null,
      googleId: null,
      password: null,
      appleRefreshToken: null,
      deactivatedAt: now.toISOString(),
      purgeAfter: purgeAfter.toISOString(),
    })
    .where(eq(users.id, userId));

  return { ok: true };
}

/**
 * Hard-delete accounts whose retention window has elapsed. Deletes each user's
 * IncomingFile rows + their R2 objects FIRST (the User delete would otherwise
 * sever the FK link, orphaning the files), then deletes the User (cascading the
 * remaining tables). Returns the count purged.
 */
export async function purgeExpiredAccounts(): Promise<{ purged: number }> {
  // String-lex comparison is valid because purgeAfter is always toISOString().
  const nowIso = new Date().toISOString();
  const due = await db.query.users.findMany({
    where: and(isNotNull(users.deactivatedAt), isNotNull(users.purgeAfter), lt(users.purgeAfter, nowIso)),
    columns: { id: true },
  });

  let purged = 0;
  for (const u of due) {
    const files = await db.query.incomingFiles.findMany({
      where: eq(incomingFiles.patientId, u.id),
      columns: { id: true, fileURL: true },
    });
    for (const f of files) {
      try {
        await deleteFromR2(f.fileURL);
      } catch {
        /* best-effort; continue purging */
      }
    }
    if (files.length) {
      await db.delete(incomingFiles).where(eq(incomingFiles.patientId, u.id));
    }
    await db.delete(users).where(eq(users.id, u.id));
    purged++;
  }
  return { purged };
}
