import { db } from '@/lib/db';
import { zabacaAgentRoles, users, patientDesignatedAgents, patientAssignments } from '@/lib/db/schema';
import { and, eq, isNotNull, notInArray } from 'drizzle-orm';

/** Returns true if the user has a ZabacaAgentRole row (DB-level check, source of truth). */
export async function isZabacaAgent(userId: string): Promise<boolean> {
  const role = await db.query.zabacaAgentRoles.findFirst({
    where: eq(zabacaAgentRoles.userId, userId),
  });
  return !!role;
}

/** Returns all user IDs that have agent roles. */
export async function getAgentUserIds(): Promise<string[]> {
  const roles = await db.select({ userId: zabacaAgentRoles.userId }).from(zabacaAgentRoles);
  return roles.map(r => r.userId);
}

/**
 * Returns all users who are "patients" — type='user', NOT a Zabaca agent, and NOT a PDA-only user.
 * A PDA-only user is someone who appears as an accepted PDA agent but has no patient assignment.
 * If a user is both a PDA and a patient (has a patient assignment), they are included.
 */
export async function getPatientUsers() {
  const [agentIds, pdaAgentRows, patientAssignmentRows] = await Promise.all([
    getAgentUserIds(),
    db.select({ agentUserId: patientDesignatedAgents.agentUserId })
      .from(patientDesignatedAgents)
      .where(and(eq(patientDesignatedAgents.status, 'accepted'), isNotNull(patientDesignatedAgents.agentUserId))),
    db.select({ patientId: patientAssignments.patientId }).from(patientAssignments),
  ]);

  const assignedPatientIds = new Set(patientAssignmentRows.map(r => r.patientId));
  // PDA-only: accepted PDA agent who is NOT also an assigned patient.
  // The isNotNull() filter in the query above guarantees agentUserId is non-null here;
  // the ! assertion is required because Drizzle doesn't narrow types from WHERE clauses.
  const pdaOnlyIds = pdaAgentRows
    .map(r => r.agentUserId!)
    .filter(id => !assignedPatientIds.has(id));

  const excludeIds = Array.from(new Set([...agentIds, ...pdaOnlyIds]));

  if (excludeIds.length === 0) {
    return db.query.users.findMany({ where: eq(users.type, 'user') });
  }
  return db.query.users.findMany({
    where: and(eq(users.type, 'user'), notInArray(users.id, excludeIds)),
  });
}
