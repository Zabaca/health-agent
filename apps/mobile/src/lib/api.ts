import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
export const SESSION_TOKEN_KEY = "session_token";

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

type ApiFetchOpts = { auth?: boolean };

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
    if (opts.auth && (res.status === 401 || res.status === 403)) {
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
  email: string;
  type: string;
  isAgent: boolean;
  isPda: boolean;
  isPatient: boolean;
  mustChangePassword: boolean;
  onboarded: boolean;
  disabled: boolean;
};

export type LoginResponse = { user: SessionUser; sessionToken: string };

export async function loginEmail(email: string, password: string): Promise<LoginResponse> {
  return (await apiFetch("/api/auth/email/mobile", {
    method: "POST",
    body: JSON.stringify({ email, password, device: getDeviceInfo() }),
  })) as LoginResponse;
}

export async function registerEmail(email: string, password: string): Promise<{ id: string; email: string }> {
  return (await apiFetch("/api/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })) as { id: string; email: string };
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
