import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { AppState } from "react-native";
import * as SecureStore from "expo-secure-store";
import {
  ApiError,
  SESSION_TOKEN_KEY,
  listSessions,
  loginEmail,
  registerEmail,
  requestPasswordReset as apiRequestPasswordReset,
  setUnauthorizedHandler,
  type SessionUser,
} from "@/lib/api";
import { authenticate, isBiometricSupported } from "@/lib/biometrics";

type Result = { ok: true } | { ok: false, error: string };

type AuthState = {
  signedIn: boolean;
  user: SessionUser | null;
  loading: boolean;
  /** Persisted user choice — true = enabled, false = explicitly disabled. */
  bioEnabled: boolean;
  /** Device supports biometrics AND has at least one enrolled. */
  bioSupported: boolean;
  /** True between sign-in and the user answering the first-run setup prompt. */
  needsBioSetup: boolean;
  /** True when biometric reveal is required to view the app. */
  locked: boolean;
  signInEmail: (email: string, password: string) => Promise<Result>;
  register: (email: string, password: string) => Promise<Result>;
  requestPasswordReset: (email: string) => Promise<Result>;
  signOut: () => Promise<void>;
  enableBiometric: () => Promise<Result>;
  disableBiometric: () => Promise<void>;
  skipBiometricSetup: () => Promise<void>;
  unlock: () => Promise<Result>;
};

const AuthContext = createContext<AuthState | null>(null);

const BIO_ENABLED_KEY = "bio_enabled";
/** Auto-lock after this much time in background. */
const FOREGROUND_LOCK_THRESHOLD_MS = 30_000;

function decodeJwtPayload(token: string): SessionUser | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (payload && typeof payload === "object" && typeof payload.email === "string") {
      return payload as SessionUser;
    }
    return null;
  } catch {
    return null;
  }
}

function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const atobFn = (globalThis as any).atob as ((s: string) => string) | undefined;
  if (atobFn) return atobFn(padded);
  throw new Error("atob not available");
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  /** null = pref absent (not yet prompted). */
  const [bioPref, setBioPref] = useState<boolean | null>(null);
  const [bioSupported, setBioSupported] = useState(false);
  const [locked, setLocked] = useState(false);
  const backgroundedAt = useRef<number | null>(null);

  // Cold-start: load token, biometric pref, support flag in parallel.
  // If signedIn + biometric enabled, start locked.
  useEffect(() => {
    (async () => {
      try {
        const [token, prefRaw, supported] = await Promise.all([
          SecureStore.getItemAsync(SESSION_TOKEN_KEY),
          SecureStore.getItemAsync(BIO_ENABLED_KEY),
          isBiometricSupported(),
        ]);
        if (token) setUser(decodeJwtPayload(token));
        const pref: boolean | null = prefRaw === "true" ? true : prefRaw === "false" ? false : null;
        setBioPref(pref);
        setBioSupported(supported);
        if (token && pref === true) setLocked(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 401/403 from the api client → clear local state.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  // Foreground revalidation + auto-lock.
  // - Track only `background` (not `inactive`, which fires for transient
  //   things like pulling down notification center).
  // - On return to active, fire listSessions() to detect server-side revocation.
  // - If background time exceeded threshold AND biometric enabled, re-lock.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        backgroundedAt.current = Date.now();
        return;
      }
      if (state !== "active") return;

      // Server revalidation (fire-and-forget).
      listSessions().catch(() => {});

      // Auto-lock only if we actually went to background long enough.
      if (
        bioPref === true &&
        backgroundedAt.current !== null &&
        Date.now() - backgroundedAt.current >= FOREGROUND_LOCK_THRESHOLD_MS
      ) {
        setLocked(true);
      }
      backgroundedAt.current = null;
    });
    return () => sub.remove();
  }, [bioPref]);

  const persistSession = useCallback(async (token: string, nextUser: SessionUser) => {
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
    setUser(nextUser);
    // After a fresh sign-in, never show the lock screen — the user just
    // proved who they are. Setup flow runs first if applicable.
    setLocked(false);
  }, []);

  const signInEmail = useCallback<AuthState["signInEmail"]>(async (email, password) => {
    try {
      const { user: nextUser, sessionToken } = await loginEmail(email, password);
      await persistSession(sessionToken, nextUser);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e.message : "Network error. Please try again." };
    }
  }, [persistSession]);

  const register = useCallback<AuthState["register"]>(async (email, password) => {
    try {
      await registerEmail(email, password);
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e.message : "Network error. Please try again." };
    }
    return signInEmail(email, password);
  }, [signInEmail]);

  const requestPasswordReset = useCallback<AuthState["requestPasswordReset"]>(async (email) => {
    try {
      await apiRequestPasswordReset(email);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof ApiError ? e.message : "Network error. Please try again." };
    }
  }, []);

  const signOut = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(SESSION_TOKEN_KEY),
      // Clear the biometric pref on sign-out so the next user (or same user
      // re-signing in) gets the first-run setup prompt again.
      SecureStore.deleteItemAsync(BIO_ENABLED_KEY),
    ]);
    setUser(null);
    setBioPref(null);
    setLocked(false);
  }, []);

  const enableBiometric = useCallback<AuthState["enableBiometric"]>(async () => {
    const result = await authenticate("Enable biometric unlock for HealthAgent");
    if (!result.ok) {
      return { ok: false, error: result.cancelled ? "Cancelled" : "Authentication failed" };
    }
    await SecureStore.setItemAsync(BIO_ENABLED_KEY, "true");
    setBioPref(true);
    return { ok: true };
  }, []);

  const disableBiometric = useCallback(async () => {
    await SecureStore.setItemAsync(BIO_ENABLED_KEY, "false");
    setBioPref(false);
  }, []);

  const skipBiometricSetup = useCallback(async () => {
    await SecureStore.setItemAsync(BIO_ENABLED_KEY, "false");
    setBioPref(false);
  }, []);

  const unlock = useCallback<AuthState["unlock"]>(async () => {
    const result = await authenticate("Unlock HealthAgent");
    if (!result.ok) {
      return { ok: false, error: result.cancelled ? "Cancelled" : "Authentication failed" };
    }
    setLocked(false);
    return { ok: true };
  }, []);

  const signedIn = user !== null;
  const bioEnabled = bioPref === true;
  const needsBioSetup = signedIn && bioPref === null && bioSupported;

  const value = useMemo<AuthState>(
    () => ({
      signedIn,
      user,
      loading,
      bioEnabled,
      bioSupported,
      needsBioSetup,
      locked: locked && signedIn,
      signInEmail,
      register,
      requestPasswordReset,
      signOut,
      enableBiometric,
      disableBiometric,
      skipBiometricSetup,
      unlock,
    }),
    [
      signedIn,
      user,
      loading,
      bioEnabled,
      bioSupported,
      needsBioSetup,
      locked,
      signInEmail,
      register,
      requestPasswordReset,
      signOut,
      enableBiometric,
      disableBiometric,
      skipBiometricSetup,
      unlock,
    ],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
