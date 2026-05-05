import { createContext, useContext, useState } from "react";
import type { UserProvider } from "@/lib/api";

export type WizardFields = {
  benefitsCoverage: boolean;
  claimsPayment: boolean;
  eligibilityEnrollment: boolean;
  financialBilling: boolean;
  medicalRecords: boolean;
  dentalRecords: boolean;
  otherNonSpecific: boolean;
  otherNonSpecificDesc: string;
  historyPhysical: boolean;
  diagnosticResults: boolean;
  treatmentProcedure: boolean;
  prescriptionMedication: boolean;
  imagingRadiology: boolean;
  dischargeSummaries: boolean;
  specificRecords: boolean;
  specificRecordsDesc: string;
  sensitiveCommDiseases: boolean;
  sensitiveReproductiveHealth: boolean;
  sensitiveHivAids: boolean;
  sensitiveMentalHealth: boolean;
  sensitiveSubstanceUse: boolean;
  sensitivePsychotherapy: boolean;
  sensitiveOther: boolean;
  sensitiveOtherDesc: string;
};

export type WizardState = {
  provider: UserProvider | null;
  fields: WizardFields | null;
  recordsSummary: string;
  representativeLabel: string;
  representativeId: string;
  expiryDate: Date | null;
  durationLabel: string;
  isEditing: boolean;
};

const defaults: WizardState = {
  provider: null,
  fields: null,
  recordsSummary: "",
  representativeLabel: "Self-requested",
  representativeId: "self",
  expiryDate: null,
  durationLabel: "",
  isEditing: false,
};

type ContextType = {
  wizard: WizardState;
  setWizard: React.Dispatch<React.SetStateAction<WizardState>>;
};

const WizardContext = createContext<ContextType>({
  wizard: defaults,
  setWizard: () => {},
});

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [wizard, setWizard] = useState<WizardState>(defaults);
  return <WizardContext.Provider value={{ wizard, setWizard }}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  return useContext(WizardContext);
}
