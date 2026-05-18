import { createContext, useContext, useState } from "react";
import type { UserProvider } from "@/lib/api";
import type { WizardFields } from "@/screens/releases/_WizardContext";

export type PdaWizardState = {
  provider: UserProvider | null;
  fields: WizardFields | null;
  recordsSummary: string;
  expiryDate: Date | null;
  durationLabel: string;
  isEditing: boolean;
};

const defaults: PdaWizardState = {
  provider: null,
  fields: null,
  recordsSummary: "",
  expiryDate: null,
  durationLabel: "",
  isEditing: false,
};

type ContextType = {
  wizard: PdaWizardState;
  setWizard: React.Dispatch<React.SetStateAction<PdaWizardState>>;
};

const PdaWizardContext = createContext<ContextType>({
  wizard: defaults,
  setWizard: () => {},
});

export function PdaWizardProvider({ children }: { children: React.ReactNode }) {
  const [wizard, setWizard] = useState<PdaWizardState>(defaults);
  return <PdaWizardContext.Provider value={{ wizard, setWizard }}>{children}</PdaWizardContext.Provider>;
}

export function usePdaWizard() {
  return useContext(PdaWizardContext);
}
