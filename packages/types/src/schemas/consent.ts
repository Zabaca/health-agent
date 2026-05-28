import { z } from 'zod';
import { parseLocalDate } from '../dates';

/** Minimum age to use the app (strictly 18+ in v1, sidestepping COPPA). */
export const MINIMUM_AGE = 18;

/** Current ToS/Privacy acceptance version. Bump when the documents change. */
export const CONSENT_VERSION = "v1";

/** Whole years between `dob` (a calendar date) and today. NaN if unparseable. */
export function calculateAge(dob: string): number {
  const birth = parseLocalDate(dob);
  if (!birth) return NaN;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

export function isAdult(dob: string): boolean {
  const age = calculateAge(dob);
  return !isNaN(age) && age >= MINIMUM_AGE;
}

/** Body for the post-auth consent gate (POST /api/consent). */
export const consentSchema = z.object({
  tosAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  // Required only for users who have no DOB on file yet (OAuth sign-ups).
  dateOfBirth: z.string().optional(),
});

export type ConsentData = z.infer<typeof consentSchema>;
