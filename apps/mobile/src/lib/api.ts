import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { ProviderFormData, ReleaseFormData } from "@health-agent/types";
import type { ClinicalRecordInput } from "./healthkit";

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
export const SESSION_TOKEN_KEY = "session_token";

export async function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
}

/**
 * Device metadata sent with every login. Surfaces in the user's "Active
 * devices" list and is the only way we have to label a session more
 * specifically than parsing the User-Agent server-side.
 */
function getDeviceInfo(): { name: string; platform: "ios" | "android" } {
  return {
    name: Platform.OS === "ios" ? "iPhone" : "Android device",
    platform: Platform.OS === "ios" ? "ios" : "android",
  };
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

type ApiFetchOpts = {
  auth?: boolean;
  /**
   * Suppress the automatic token-clear + global sign-out that a 401/403
   * normally triggers. Used by the consent call, whose underage 403 must be
   * surfaced to the screen (to explain why) before we sign the user out —
   * letting the global handler fire here would unmount the screen mid-Alert.
   */
  skipAutoSignout?: boolean;
};

/**
 * Called when an authed request 401s — i.e., the bearer was revoked,
 * expired, or the user was suspended. Wired by AuthProvider to clear local
 * state so the user lands on SignIn.
 */
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(fn: (() => void) | null) {
  unauthorizedHandler = fn;
}

async function apiFetch(path: string, init: RequestInit = {}, opts: ApiFetchOpts = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  if (opts.auth) {
    const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : null) ?? `Request failed (${res.status})`;
    // Auto-signout on auth failures from authed requests. Covers both
    // explicit revocation ("Session revoked") and suspension/expiry.
    if (opts.auth && !opts.skipAutoSignout && (res.status === 401 || res.status === 403)) {
      await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
      unauthorizedHandler?.();
    }
    throw new ApiError(res.status, message);
  }
  return data;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export type SessionUser = {
  id: string;
  // null when the OAuth provider returned no email (collected at onboarding).
  email: string | null;
  type: string;
  isAgent: boolean;
  isPda: boolean;
  isPatient: boolean;
  mustChangePassword: boolean;
  onboarded: boolean;
  disabled: boolean;
  // ISO-8601 timestamp the user accepted consent; null until the consent gate
  // is cleared. PDA-invited accounts are exempt and stay null.
  consentedAt: string | null;
};

export type LoginResponse = { user: SessionUser; sessionToken: string };

export async function loginEmail(email: string, password: string): Promise<LoginResponse> {
  return (await apiFetch("/api/auth/email/mobile", {
    method: "POST",
    body: JSON.stringify({ email, password, device: getDeviceInfo() }),
  })) as LoginResponse;
}

/** Apple returns the name only on the first authorization; forward it so a new account gets one. */
export type AppleFullName = { givenName?: string | null; familyName?: string | null };

export async function loginApple(
  identityToken: string,
  fullName?: AppleFullName | null,
  authorizationCode?: string | null,
): Promise<LoginResponse> {
  return (await apiFetch("/api/auth/apple/mobile", {
    method: "POST",
    body: JSON.stringify({
      identityToken,
      fullName: fullName ?? undefined,
      // Lets the backend exchange it for a refresh token (revocable at deletion).
      authorizationCode: authorizationCode ?? undefined,
      device: getDeviceInfo(),
    }),
  })) as LoginResponse;
}

export async function loginGoogle(idToken: string): Promise<LoginResponse> {
  return (await apiFetch("/api/auth/google/mobile", {
    method: "POST",
    body: JSON.stringify({ idToken, device: getDeviceInfo() }),
  })) as LoginResponse;
}

export async function registerEmail(
  email: string,
  password: string,
  dateOfBirth: string,
): Promise<{ id: string; email: string }> {
  return (await apiFetch("/api/register", {
    method: "POST",
    body: JSON.stringify({ email, password, dateOfBirth }),
  })) as { id: string; email: string };
}

export async function recordConsent(
  dateOfBirth?: string,
): Promise<{ user: SessionUser; sessionToken: string }> {
  return (await apiFetch(
    "/api/consent",
    {
      method: "POST",
      body: JSON.stringify({
        tosAccepted: true,
        privacyAccepted: true,
        ...(dateOfBirth ? { dateOfBirth } : {}),
      }),
    },
    // The underage 403 hard-deletes the account; the caller surfaces it and
    // signs out explicitly, so don't let the global 403 handler race the Alert.
    { auth: true, skipAutoSignout: true },
  )) as { user: SessionUser; sessionToken: string };
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch("/api/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export type ActiveSession = {
  id: string;
  platform: "web" | "ios" | "android";
  deviceName: string | null;
  userAgent: string | null;
  ip: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  expires: string;
  isCurrent: boolean;
};

export async function listSessions(): Promise<{ currentSessionId: string | null; sessions: ActiveSession[] }> {
  return (await apiFetch("/api/me/sessions", {}, { auth: true })) as {
    currentSessionId: string | null;
    sessions: ActiveSession[];
  };
}

export async function revokeSession(id: string): Promise<{ success: boolean; revokedSelf: boolean }> {
  return (await apiFetch(`/api/me/sessions/${encodeURIComponent(id)}`, { method: "DELETE" }, { auth: true })) as {
    success: boolean;
    revokedSelf: boolean;
  };
}

export async function revokeCurrentSession(): Promise<void> {
  await apiFetch("/api/me/sessions/current", { method: "DELETE" }, { auth: true });
}

// ─── Setup Status ─────────────────────────────────────────────────────────────

export type SetupStatus = {
  firstName: string | null;
  profileComplete: boolean;
  providerAdded: boolean;
  pdaAdded: boolean;
  releaseCreated: boolean;
  healthKitConnected: boolean;
};

export async function getSetupStatus(): Promise<SetupStatus> {
  return (await apiFetch("/api/me/setup-status", {}, { auth: true })) as SetupStatus;
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export type ProfileData = {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  phoneNumber: string;
  ssn: string;
  avatarUrl: string | null;
  // null when the OAuth provider returned no email — the client must collect one.
  email: string | null;
};

export async function getProfile(): Promise<ProfileData> {
  return (await apiFetch("/api/profile", {}, { auth: true })) as ProfileData;
}

export type UpdateProfileInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  phoneNumber: string;
  ssn?: string;
  avatarUrl?: string;
  // Only sent during onboarding when the account has no email yet.
  email?: string;
};

export async function updateProfile(data: UpdateProfileInput): Promise<{ success: boolean }> {
  return (await apiFetch("/api/profile", { method: "PUT", body: JSON.stringify(data) }, { auth: true })) as { success: boolean };
}

export type PatchProfileInput = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  avatarUrl?: string | null;
  email?: string;
  healthKitConnected?: boolean;
};

export async function patchProfile(data: PatchProfileInput): Promise<{ success: boolean }> {
  return (await apiFetch("/api/profile", { method: "PATCH", body: JSON.stringify(data) }, { auth: true })) as { success: boolean };
}

// ─── Health Data ──────────────────────────────────────────────────────────────

export type HealthRecord = {
  type: string;
  date: string;
  value: number;
  unit: string;
  source?: string;
};

export type HealthDataRow = {
  id: string;
  type: string;
  date: string;
  value: number;
  unit: string;
  source: string | null;
  updatedAt: string;
};

export async function postHealthData(records: HealthRecord[]): Promise<{ success: boolean }> {
  return (await apiFetch(
    "/api/health-data",
    { method: "POST", body: JSON.stringify({ records }) },
    { auth: true },
  )) as { success: boolean };
}

export async function getHealthData(opts?: {
  from?: string;
  to?: string;
  type?: string[];
}): Promise<HealthDataRow[]> {
  const params = new URLSearchParams();
  if (opts?.from) params.set("from", opts.from);
  if (opts?.to) params.set("to", opts.to);
  if (opts?.type?.length) params.set("type", opts.type.join(","));
  const qs = params.toString();
  return (await apiFetch(`/api/health-data${qs ? `?${qs}` : ""}`, {}, { auth: true })) as HealthDataRow[];
}

export async function postClinicalRecords(records: ClinicalRecordInput[]): Promise<{ success: boolean }> {
  return (await apiFetch(
    "/api/clinical-records",
    { method: "POST", body: JSON.stringify({ records }) },
    { auth: true },
  )) as { success: boolean };
}

export type ClinicalRecordSummary = {
  counts: Record<string, number>;
  latestUpdatedAt: string | null;
  total: number;
};

export async function getClinicalRecordSummary(): Promise<ClinicalRecordSummary> {
  return (await apiFetch("/api/clinical-records", {}, { auth: true })) as ClinicalRecordSummary;
}

// ─── Connected accounts (link/unlink OAuth providers) ──────────────────────────

export type Connections = {
  email: string | null;
  hasPassword: boolean;
  apple: boolean;
  google: boolean;
};

export async function getConnections(): Promise<Connections> {
  return (await apiFetch("/api/account/connections", {}, { auth: true })) as Connections;
}

/** Attach an Apple identity (native) to the current account. Throws ApiError(409) on conflict. */
export async function linkAppleAccount(
  identityToken: string,
  authorizationCode?: string | null,
): Promise<{ success: boolean }> {
  return (await apiFetch(
    "/api/auth/apple/link",
    { method: "POST", body: JSON.stringify({ identityToken, authorizationCode: authorizationCode ?? undefined }) },
    { auth: true },
  )) as { success: boolean };
}

/** Attach a Google identity (native) to the current account. Throws ApiError(409) on conflict. */
export async function linkGoogleAccount(idToken: string): Promise<{ success: boolean }> {
  return (await apiFetch(
    "/api/auth/google/link",
    { method: "POST", body: JSON.stringify({ idToken }) },
    { auth: true },
  )) as { success: boolean };
}

/** Unlink a provider. Throws ApiError(400) if it's the only remaining sign-in method. */
export async function unlinkConnection(provider: "apple" | "google"): Promise<{ success: boolean }> {
  return (await apiFetch(
    `/api/account/connections/${provider}`,
    { method: "DELETE" },
    { auth: true },
  )) as { success: boolean };
}

/** Permanently delete the current account (soft-delete + retention). Throws ApiError(403) for staff. */
export async function deleteAccount(): Promise<{ success: boolean }> {
  return (await apiFetch("/api/account", { method: "DELETE" }, { auth: true })) as { success: boolean };
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok: boolean }> {
  return (await apiFetch(
    "/api/password/change",
    { method: "PUT", body: JSON.stringify({ currentPassword, newPassword }) },
    { auth: true }
  )) as { ok: boolean };
}

// Set an initial password for an OAuth-only account (no current password to verify).
export async function setPassword(newPassword: string): Promise<{ ok: boolean }> {
  return (await apiFetch(
    "/api/password/set",
    { method: "POST", body: JSON.stringify({ newPassword }) },
    { auth: true }
  )) as { ok: boolean };
}

// ─── Providers ────────────────────────────────────────────────────────────────

export type UserProvider = {
  id: string;
  userId: string;
  order: number;
  providerName: string;
  providerType: "Hospital" | "Facility" | "Insurance";
  physicianName: string | null;
  patientId: string | null;
  insurance: string | null;
  patientMemberId: string | null;
  groupId: string | null;
  planName: string | null;
  phone: string | null;
  fax: string | null;
  providerEmail: string | null;
  address: string | null;
  membershipIdFront: string | null;
  membershipIdBack: string | null;
};

export type MyProviderInput = {
  providerName?: string;
  providerType: "Insurance" | "Hospital" | "Facility";
  physicianName?: string;
  patientId?: string;
  insurance?: string;
  patientMemberId?: string;
  groupId?: string;
  planName?: string;
  phone?: string;
  fax?: string;
  providerEmail?: string;
  address?: string;
  membershipIdFront?: string;
  membershipIdBack?: string;
};

export async function listMyProviders(): Promise<UserProvider[]> {
  return (await apiFetch("/api/my-providers", {}, { auth: true })) as UserProvider[];
}

export async function replaceMyProviders(providers: MyProviderInput[]): Promise<{ success: boolean }> {
  return (await apiFetch(
    "/api/my-providers",
    { method: "PUT", body: JSON.stringify({ providers }) },
    { auth: true }
  )) as { success: boolean };
}

// ─── Designated Agents ────────────────────────────────────────────────────────

export type DesignatedAgentUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type DesignatedAgent = {
  id: string;
  inviteeEmail: string;
  relationship: string | null;
  status: string;
  healthRecordsPermission: string | null;
  manageProvidersPermission: string | null;
  releasePermission: string | null;
  createdAt: string;
  tokenExpiresAt: string | null;
  agentUser: DesignatedAgentUser | null;
};

export type AssignedAgent = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

export type DesignatedAgentsResponse = {
  assignedAgent: AssignedAgent | null;
  designatedAgents: DesignatedAgent[];
};

export async function listMyDesignatedAgents(): Promise<DesignatedAgentsResponse> {
  return (await apiFetch("/api/my-designated-agents", {}, { auth: true })) as DesignatedAgentsResponse;
}

export type InviteAgentInput = {
  inviteeEmail: string;
  relationship?: string;
  healthRecordsPermission?: 'viewer' | 'editor' | null;
  manageProvidersPermission?: 'viewer' | 'editor' | null;
  releasePermission?: 'viewer' | 'editor' | null;
};

export async function inviteDesignatedAgent(data: InviteAgentInput): Promise<{ id: string }> {
  return (await apiFetch(
    "/api/my-designated-agents",
    { method: "POST", body: JSON.stringify(data) },
    { auth: true }
  )) as { id: string };
}

export type UpdateAgentInput = {
  relationship?: string | null;
  healthRecordsPermission?: 'viewer' | 'editor' | null;
  manageProvidersPermission?: 'viewer' | 'editor' | null;
  releasePermission?: 'viewer' | 'editor' | null;
};

export async function updateDesignatedAgent(id: string, data: UpdateAgentInput): Promise<{ success: boolean }> {
  return (await apiFetch(
    `/api/my-designated-agents/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(data) },
    { auth: true }
  )) as { success: boolean };
}

export async function revokeDesignatedAgent(id: string): Promise<{ success: boolean }> {
  return (await apiFetch(
    `/api/my-designated-agents/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    { auth: true }
  )) as { success: boolean };
}

// ─── Releases ─────────────────────────────────────────────────────────────────

export type ReleaseSummary = {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  voided: boolean;
  authSignatureImage: string | null;
  authExpirationDate: string | null;
  releaseCode: string | null;
  releaseAuthAgent: boolean;
  authAgentName: string | null;
  providerName: string | null;
  providerType: string | null;
  insurance: string | null;
};

export type ReleaseProvider = {
  id: string;
  releaseId: string;
  order: number;
  providerName: string;
  providerType: string;
  physicianName: string | null;
  patientId: string | null;
  insurance: string | null;
  patientMemberId: string | null;
  groupId: string | null;
  planName: string | null;
  phone: string | null;
  fax: string | null;
  providerEmail: string | null;
  address: string | null;
  membershipIdFront: string | null;
  membershipIdBack: string | null;
  benefitsCoverage: boolean;
  claimsPayment: boolean;
  eligibilityEnrollment: boolean;
  financialBilling: boolean;
  medicalRecords: boolean;
  dentalRecords: boolean;
  otherNonSpecific: boolean;
  otherNonSpecificDesc: string | null;
  historyPhysical: boolean;
  diagnosticResults: boolean;
  treatmentProcedure: boolean;
  prescriptionMedication: boolean;
  imagingRadiology: boolean;
  dischargeSummaries: boolean;
  specificRecords: boolean;
  specificRecordsDesc: string | null;
  sensitiveCommDiseases: boolean;
  sensitiveReproductiveHealth: boolean;
  sensitiveHivAids: boolean;
  sensitiveMentalHealth: boolean;
  sensitiveSubstanceUse: boolean;
  sensitivePsychotherapy: boolean;
  sensitiveOther: boolean;
  sensitiveOtherDesc: string | null;
  dateRangeFrom: string | null;
  dateRangeTo: string | null;
  allAvailableDates: boolean;
  purpose: string | null;
  purposeOther: string | null;
};

export type ReleaseDetail = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string;
  mailingAddress: string;
  phoneNumber: string;
  email: string;
  ssn: string | null;
  releaseAuthAgent: boolean;
  releaseAuthZabaca: boolean;
  authAgentFirstName: string | null;
  authAgentLastName: string | null;
  authAgentOrganization: string | null;
  authAgentAddress: string | null;
  authAgentPhone: string | null;
  authAgentEmail: string | null;
  authExpirationDate: string | null;
  authExpirationEvent: string | null;
  authPrintedName: string;
  authSignatureImage: string | null;
  authDate: string;
  authAgentName: string | null;
  voided: boolean;
  releaseCode: string | null;
  providers: ReleaseProvider[];
};

// Derived from @health-agent/types so mobile and web share the same schema source.
export type ReleaseProviderInput = ProviderFormData;
export type CreateReleaseInput = ReleaseFormData;

export type SignReleaseInput = {
  signatureImage: string;
  printedName: string;
  authDate: string;
  expirationDate: string;
  expirationEvent?: string;
};

export async function listReleases(): Promise<ReleaseSummary[]> {
  return (await apiFetch("/api/releases", {}, { auth: true })) as ReleaseSummary[];
}

export async function getRelease(id: string): Promise<ReleaseDetail> {
  return (await apiFetch(`/api/releases/${encodeURIComponent(id)}`, {}, { auth: true })) as ReleaseDetail;
}

export async function createRelease(input: CreateReleaseInput): Promise<ReleaseDetail[]> {
  return (await apiFetch(
    "/api/releases",
    { method: "POST", body: JSON.stringify(input) },
    { auth: true }
  )) as ReleaseDetail[];
}

export async function voidRelease(id: string): Promise<{ success: boolean }> {
  return (await apiFetch(
    `/api/releases/${encodeURIComponent(id)}`,
    { method: "PATCH" },
    { auth: true }
  )) as { success: boolean };
}

export async function signRelease(id: string, input: SignReleaseInput): Promise<{ success: boolean }> {
  return (await apiFetch(
    `/api/releases/${encodeURIComponent(id)}/sign`,
    { method: "POST", body: JSON.stringify(input) },
    { auth: true }
  )) as { success: boolean };
}

// ─── Representing (PDA) ───────────────────────────────────────────────────────

export type RepresentingReleaseSummary = {
  id: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
  voided: boolean;
  authSignatureImage: string | null;
  releaseCode: string | null;
  releaseAuthAgent: boolean;
  authAgentFirstName: string | null;
  authAgentLastName: string | null;
  providerNames: (string | null | undefined)[];
};

export type CreateRepresentingReleaseInput = {
  providers: ReleaseProviderInput[];
  authExpirationDate?: string;
  authPrintedName?: string;
  authDate?: string;
};

export async function listRepresentingProviders(patientId: string): Promise<UserProvider[]> {
  return (await apiFetch(
    `/api/representing/${encodeURIComponent(patientId)}/providers`,
    {},
    { auth: true }
  )) as UserProvider[];
}

export async function replaceRepresentingProviders(
  patientId: string,
  providers: MyProviderInput[],
): Promise<{ success: boolean }> {
  return (await apiFetch(
    `/api/representing/${encodeURIComponent(patientId)}/providers`,
    { method: "PUT", body: JSON.stringify({ providers }) },
    { auth: true },
  )) as { success: boolean };
}

export async function listRepresentingReleases(patientId: string): Promise<RepresentingReleaseSummary[]> {
  return (await apiFetch(
    `/api/representing/${encodeURIComponent(patientId)}/releases`,
    {},
    { auth: true }
  )) as RepresentingReleaseSummary[];
}

export async function getRepresentingRelease(patientId: string, releaseId: string): Promise<ReleaseDetail> {
  return (await apiFetch(
    `/api/representing/${encodeURIComponent(patientId)}/releases/${encodeURIComponent(releaseId)}`,
    {},
    { auth: true }
  )) as ReleaseDetail;
}

export async function voidRepresentingRelease(patientId: string, releaseId: string): Promise<{ success: boolean }> {
  return (await apiFetch(
    `/api/representing/${encodeURIComponent(patientId)}/releases/${encodeURIComponent(releaseId)}`,
    { method: "DELETE" },
    { auth: true }
  )) as { success: boolean };
}

export async function createRepresentingRelease(
  patientId: string,
  input: CreateRepresentingReleaseInput
): Promise<{ id: string }> {
  return (await apiFetch(
    `/api/representing/${encodeURIComponent(patientId)}/releases`,
    { method: "POST", body: JSON.stringify(input) },
    { auth: true }
  )) as { id: string };
}

export type RepresentedPatient = {
  patientId: string;
  relationship: string | null;
  healthRecordsPermission: "viewer" | "editor" | null;
  manageProvidersPermission: "viewer" | "editor" | null;
  releasePermission: "viewer" | "editor" | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

/**
 * Display name for a represented patient: full name when set, otherwise the
 * patient's email. Patients who haven't completed their profile have no name,
 * and we must never surface the raw user ID to their designated agents. Email
 * can also be absent (OAuth users pre-onboarding), so fall back to a label.
 */
export function representedPatientName(
  p: Pick<RepresentedPatient, "firstName" | "lastName" | "email">,
): string {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.email || "Patient";
}

export type RepresentingRecord = {
  id: string;
  fileURL: string;
  fileType: string;
  source: string;
  createdAt: string;
  userProviderId: string | null;
  pagecount: number | null;
  originalName: string | null;
  uploadedBy: { id: string; firstName: string | null; lastName: string | null } | null;
  // FHIR-only (source === "healthkitFHIR"); null for documents.
  type?: string | null;
  time?: string | null;
  fhirDisplayName?: string | null;
  fhirRecordType?: string | null;
  fhirSource?: string | null;
};

export type RepresentingRecordsResponse = {
  files: RepresentingRecord[];
  permission: "viewer" | "editor";
  canUpload: boolean;
};

export async function listRepresentingRecords(patientId: string): Promise<RepresentingRecordsResponse> {
  return (await apiFetch(
    `/api/representing/${encodeURIComponent(patientId)}/records`,
    {},
    { auth: true }
  )) as RepresentingRecordsResponse;
}

export async function listRepresentingRecordProviders(patientId: string): Promise<RecordProvider[]> {
  const res = (await apiFetch(
    `/api/representing/${encodeURIComponent(patientId)}/records/providers`,
    {},
    { auth: true }
  )) as { providers: RecordProvider[] };
  return res.providers;
}

/** Single record (incl. full FHIR resource) for a represented patient. Mirrors
 *  getMyRecord but scoped to the PDA's granted access. */
export async function getRepresentingRecord(
  patientId: string,
  id: string,
): Promise<IncomingFile | FhirRecord> {
  return (await apiFetch(
    `/api/representing/${encodeURIComponent(patientId)}/records/${encodeURIComponent(id)}`,
    {},
    { auth: true }
  )) as IncomingFile | FhirRecord;
}

export async function listRepresentedPatients(): Promise<RepresentedPatient[]> {
  const res = (await apiFetch("/api/representing", {}, { auth: true })) as {
    patients: RepresentedPatient[];
  };
  return res.patients;
}

export type PendingRepresentingInvite = {
  id: string;
  relationship: string | null;
  healthRecordsPermission: "viewer" | "editor" | null;
  manageProvidersPermission: "viewer" | "editor" | null;
  releasePermission: "viewer" | "editor" | null;
  createdAt: string;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientEmail: string;
};

export async function listPendingRepresentingInvites(): Promise<PendingRepresentingInvite[]> {
  const res = (await apiFetch("/api/representing/pending", {}, { auth: true })) as {
    invites: PendingRepresentingInvite[];
  };
  return res.invites;
}

export async function respondToRepresentingInvite(
  id: string,
  action: "accept" | "decline",
): Promise<{ ok: true }> {
  return (await apiFetch(
    `/api/representing/pending/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify({ action }) },
    { auth: true },
  )) as { ok: true };
}

// ─── Records ──────────────────────────────────────────────────────────────────

export type IncomingFile = {
  id: string;
  fileURL: string;
  fileType: string;
  source: string;
  incomingFaxLogId: string | null;
  patientId: string | null;
  userProviderId: string | null;
  createdAt: string;
  deletedAt: string | null;
  deletedById: string | null;
  faxLog?: { pagecount?: number | null } | null;
  uploadLog?: { originalName: string } | null;
  // FHIR-only (source === "healthkitFHIR"). `type` holds the FHIR resourceType
  // (Observation, Condition, …), `time` the clinical effective date.
  type?: string | null;
  time?: string | null;
  fhirDisplayName?: string | null;
  fhirRecordType?: string | null;
  fhirSource?: string | null;
};

export type FhirRecord = IncomingFile & {
  fhirRelease?: string | null;
  fhirVersion?: string | null;
  fhirData: unknown;
};

export async function getMyRecord(id: string): Promise<IncomingFile | FhirRecord> {
  return (await apiFetch(`/api/my-records/${encodeURIComponent(id)}`, {}, { auth: true })) as
    | IncomingFile
    | FhirRecord;
}

export type RecordsPage = { items: IncomingFile[]; nextCursor: string | null };

export async function listMyRecords(opts?: { cursor?: string | null; limit?: number }): Promise<RecordsPage> {
  const params = new URLSearchParams();
  if (opts?.cursor) params.set("cursor", opts.cursor);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString();
  return (await apiFetch(`/api/my-records${qs ? `?${qs}` : ""}`, {}, { auth: true })) as RecordsPage;
}

export type RecordProvider = { id: string; name: string };

export async function listMyRecordProviders(): Promise<RecordProvider[]> {
  const res = (await apiFetch("/api/my-records/providers", {}, { auth: true })) as {
    providers: RecordProvider[];
  };
  return res.providers;
}

export async function patchRecord(
  id: string,
  data: { originalName?: string; userProviderId?: string | null },
): Promise<{ ok: true }> {
  return (await apiFetch(
    `/api/documents/${encodeURIComponent(id)}`,
    { method: "PATCH", body: JSON.stringify(data) },
    { auth: true },
  )) as { ok: true };
}

export async function registerRecord(input: {
  fileURL: string;
  fileType: string;
  originalName: string;
  patientId?: string;
  userProviderId?: string;
}): Promise<{ id: string }> {
  return (await apiFetch("/api/records/upload", {
    method: "POST",
    body: JSON.stringify(input),
  }, { auth: true })) as { id: string };
}

/**
 * Uploads a local file (camera capture or photo-library asset) to /api/upload
 * via XHR so we get progress events. Returns the stored file URL the records
 * endpoint expects. Mirrors the web flow in
 * apps/web/src/components/records/UploadFileButton.tsx.
 */
export async function uploadFile(opts: {
  uri: string;
  mimeType: string;
  name: string;
  onProgress?: (pct: number) => void;
}): Promise<{ url: string }> {
  const token = await getSessionToken();
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    // RN's FormData accepts the {uri,name,type} file shape — TS lacks the
    // overload, so cast at the call site.
    form.append("file", { uri: opts.uri, name: opts.name, type: opts.mimeType } as unknown as Blob);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && opts.onProgress) {
        opts.onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });
    xhr.addEventListener("load", async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch {
          reject(new ApiError(xhr.status, "Invalid upload response"));
        }
        return;
      }
      // Match apiFetch: signal auth failure to the AuthProvider.
      if (xhr.status === 401 || xhr.status === 403) {
        await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
        unauthorizedHandler?.();
      }
      let message = `Upload failed (${xhr.status})`;
      try {
        const data = JSON.parse(xhr.responseText);
        if (data && typeof data.error === "string") message = data.error;
      } catch {}
      reject(new ApiError(xhr.status, message));
    });
    xhr.addEventListener("error", () => reject(new ApiError(0, "Network error")));
    xhr.addEventListener("abort", () => reject(new ApiError(0, "Upload aborted")));

    xhr.open("POST", `${API_URL}/api/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send(form);
  });
}
