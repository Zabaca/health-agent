import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useAuth } from "./useAuth";

export type Role = "patient" | "pda";

type RoleState = {
  role: Role;
  representing: string | null;
  switchTo: (role: Role, representing?: string | null) => void;
};

const RoleContext = createContext<RoleState | null>(null);

export function RoleProvider({ children }: PropsWithChildren) {
  const { signedIn, user } = useAuth();
  const [role, setRole] = useState<Role>("patient");
  const [representing, setRepresenting] = useState<string | null>(null);
  // Which signed-in user we've already picked a landing role for, so a later
  // manual switchTo() isn't clobbered on re-render.
  const [defaultedFor, setDefaultedFor] = useState<string | null>(null);

  // Pick the landing role once per sign-in. A PDA-only account — someone who
  // accepted a PDA invite but isn't a patient themselves — lands in PDA view so
  // they're never funneled into the patient onboarding/profile flow. Everyone
  // else (patients, and patient+PDA users) starts as a patient and can switch.
  // Done during render (`signedIn` implies a loaded `user`) so there's no flash
  // of the wrong navigator.
  if (signedIn && user && defaultedFor !== user.id) {
    setDefaultedFor(user.id);
    setRole(user.isPda && !user.isPatient ? "pda" : "patient");
    setRepresenting(null);
  }

  // When the user signs out, reset so the next sign-in re-defaults.
  useEffect(() => {
    if (!signedIn) {
      setRole("patient");
      setRepresenting(null);
      setDefaultedFor(null);
    }
  }, [signedIn]);

  const switchTo = useCallback((next: Role, rep: string | null = null) => {
    setRole(next);
    setRepresenting(next === "pda" ? rep : null);
  }, []);

  const value = useMemo<RoleState>(() => ({ role, representing, switchTo }), [role, representing, switchTo]);
  return createElement(RoleContext.Provider, { value }, children);
}

export function useRole(): RoleState {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside <RoleProvider>");
  return ctx;
}
