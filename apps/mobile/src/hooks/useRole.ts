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
  const { signedIn } = useAuth();
  const [role, setRole] = useState<Role>("patient");
  const [representing, setRepresenting] = useState<string | null>(null);

  // When the user signs out, reset role so the next sign-in starts as patient.
  useEffect(() => {
    if (!signedIn) {
      setRole("patient");
      setRepresenting(null);
    }
  }, [signedIn]);

  const switchTo = useCallback((next: Role, rep: string | null = null) => {
    setRole(next);
    setRepresenting(next === "pda" ? rep ?? "marcus" : null);
  }, []);

  const value = useMemo<RoleState>(() => ({ role, representing, switchTo }), [role, representing, switchTo]);
  return createElement(RoleContext.Provider, { value }, children);
}

export function useRole(): RoleState {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside <RoleProvider>");
  return ctx;
}
