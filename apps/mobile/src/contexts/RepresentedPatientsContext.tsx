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
import {
  listRepresentedPatients,
  listPendingRepresentingInvites,
  type RepresentedPatient,
  type PendingRepresentingInvite,
} from "@/lib/api";
import { useRole } from "@/hooks/useRole";

type RepresentedPatientsState = {
  patients: RepresentedPatient[];
  pendingInvites: PendingRepresentingInvite[];
  loading: boolean;
  currentPatient: RepresentedPatient | null;
  refresh: () => Promise<void>;
};

const RepresentedPatientsContext = createContext<RepresentedPatientsState | null>(null);

export function RepresentedPatientsProvider({ children }: PropsWithChildren) {
  const { representing, switchTo } = useRole();
  const [patients, setPatients] = useState<RepresentedPatient[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingRepresentingInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      // Pending invites are best-effort: a failure there must not drop the
      // accepted-patient list or boot the user.
      const [list, invites] = await Promise.all([
        listRepresentedPatients(),
        listPendingRepresentingInvites().catch(() => [] as PendingRepresentingInvite[]),
      ]);
      setPatients((prev) => {
        // Only force-switch back to patient mode when an existing relationship
        // disappears (revoked/declined). Don't boot a brand-new user who simply
        // hasn't accepted any invites yet.
        if (prev.length > 0 && list.length === 0) switchTo("patient");
        return list;
      });
      setPendingInvites(invites);
    } catch (e) {
      // network error — keep existing state, don't boot user
      if (__DEV__) console.warn("[RepresentedPatientsContext] load failed:", e);
    } finally {
      setLoading(false);
    }
  }, [switchTo]);

  useEffect(() => {
    void load();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void load();
    });
    return () => sub.remove();
  }, [load]);

  const currentPatient = useMemo(
    () => patients.find((p) => p.patientId === representing) ?? patients[0] ?? null,
    [patients, representing],
  );

  const value = useMemo<RepresentedPatientsState>(
    () => ({ patients, pendingInvites, loading, currentPatient, refresh: load }),
    [patients, pendingInvites, loading, currentPatient, load],
  );

  return createElement(RepresentedPatientsContext.Provider, { value }, children);
}

export function useRepresentedPatients(): RepresentedPatientsState {
  const ctx = useContext(RepresentedPatientsContext);
  if (!ctx) throw new Error("useRepresentedPatients must be inside <RepresentedPatientsProvider>");
  return ctx;
}
