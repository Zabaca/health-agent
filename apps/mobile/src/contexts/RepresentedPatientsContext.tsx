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
import { listRepresentedPatients, type RepresentedPatient } from "@/lib/api";
import { useRole } from "@/hooks/useRole";

type RepresentedPatientsState = {
  patients: RepresentedPatient[];
  loading: boolean;
  currentPatient: RepresentedPatient | null;
};

const RepresentedPatientsContext = createContext<RepresentedPatientsState | null>(null);

export function RepresentedPatientsProvider({ children }: PropsWithChildren) {
  const { representing, switchTo } = useRole();
  const [patients, setPatients] = useState<RepresentedPatient[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const list = await listRepresentedPatients();
      setPatients(list);
      if (list.length === 0) switchTo("patient");
    } catch {
      // network error — keep existing state, don't boot user
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
    () => ({ patients, loading, currentPatient }),
    [patients, loading, currentPatient],
  );

  return createElement(RepresentedPatientsContext.Provider, { value }, children);
}

export function useRepresentedPatients(): RepresentedPatientsState {
  const ctx = useContext(RepresentedPatientsContext);
  if (!ctx) throw new Error("useRepresentedPatients must be inside <RepresentedPatientsProvider>");
  return ctx;
}
