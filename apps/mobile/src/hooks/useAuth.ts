import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

type Result = { ok: true } | { ok: false, error: string };

type AuthState = {
  signedIn: boolean;
  user: SessionUser | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<Result>;
  register: (email: string, password: string) => Promise<Result>;
  requestPasswordReset: (email: string) => Promise<Result>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

function decodeJwtPayload(token: string): SessionUser | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    // RN doesn't have atob globally before SDK 50; use Buffer-free base64 decode.
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
  // global.atob is available in React Native 0.74+.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const atobFn = (globalThis as any).atob as ((s: string) => string) | undefined;
  if (atobFn) return atobFn(padded);
  throw new Error("atob not available");
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await SecureStore.getItemAsync(SESSION_TOKEN_KEY);
        if (token) setUser(decodeJwtPayload(token));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Wire api-client auth failures (401/403) into local sign-out so a revoked
  // bearer kicks the user back to SignIn on the next protected request.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  // Validate the bearer when the app comes to foreground. listSessions() is a
  // cheap GET that runs through the same auth-failure handler above, so a
  // revoked token automatically signs the user out on resume — no UI prompt.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      // Fire-and-forget; errors flow through setUnauthorizedHandler above.
      listSessions().catch(() => {});
    });
    return () => sub.remove();
  }, []);

  const persistSession = useCallback(async (token: string, nextUser: SessionUser) => {
    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
    setUser(nextUser);
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
    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      signedIn: user !== null,
      user,
      loading,
      signInEmail,
      register,
      requestPasswordReset,
      signOut,
    }),
    [user, loading, signInEmail, register, requestPasswordReset, signOut],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
