import { createContext, useContext, useState } from "react";
import { Switch, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ClipboardList, Microscope, FileText, Pill, Scan, FileCheck, FileSearch,
  ShieldCheck, Receipt, UserCheck, CreditCard,
  Stethoscope, Smile, FileQuestion,
  Activity, Heart, Shield, Brain, FlaskConical, MessageCircle, FilePlus,
  type LucideIcon,
} from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Input } from "@/components/Input";
import type { ReleasesParamList } from "@/navigation/types";
import { WizardShell } from "./_WizardShell";
import { useWizard, type WizardFields } from "./_WizardContext";

type Nav = NativeStackNavigationProp<ReleasesParamList>;
type Route = RouteProp<ReleasesParamList, "WizardStep2">;

const GreenCardContext = createContext(false);

type Fields = WizardFields;

const RECORD_LABELS: Partial<Record<keyof Fields, string>> = {
  benefitsCoverage: "Benefits & Coverage",
  claimsPayment: "Claims & Payment",
  eligibilityEnrollment: "Eligibility & Enrollment",
  financialBilling: "Financial / Billing",
  medicalRecords: "Medical Records",
  dentalRecords: "Dental Records",
  otherNonSpecific: "Other Non-Specific",
  historyPhysical: "History & Physical",
  diagnosticResults: "Diagnostic Results",
  treatmentProcedure: "Treatment / Procedure Notes",
  prescriptionMedication: "Prescription / Medication",
  imagingRadiology: "Imaging / Radiology",
  dischargeSummaries: "Discharge Summaries",
  specificRecords: "Specific Records",
  sensitiveCommDiseases: "Communicable Diseases",
  sensitiveReproductiveHealth: "Reproductive Health",
  sensitiveHivAids: "HIV/AIDS",
  sensitiveMentalHealth: "Mental Health",
  sensitiveSubstanceUse: "Substance Use Disorder",
  sensitivePsychotherapy: "Psychotherapy Notes",
  sensitiveOther: "Other (Sensitive)",
};

function computeRecordsSummary(fields: Fields): string {
  const keys = Object.keys(RECORD_LABELS) as (keyof Fields)[];
  const selected = keys.filter(k => fields[k] === true);
  return selected.map(k => RECORD_LABELS[k]!).join(", ");
}

const INITIAL: Fields = {
  benefitsCoverage: false, claimsPayment: false, eligibilityEnrollment: false, financialBilling: false,
  medicalRecords: false, dentalRecords: false, otherNonSpecific: false, otherNonSpecificDesc: "",
  historyPhysical: false, diagnosticResults: false, treatmentProcedure: false,
  prescriptionMedication: false, imagingRadiology: false, dischargeSummaries: false,
  specificRecords: false, specificRecordsDesc: "",
  sensitiveCommDiseases: false, sensitiveReproductiveHealth: false, sensitiveHivAids: false,
  sensitiveMentalHealth: false, sensitiveSubstanceUse: false, sensitivePsychotherapy: false,
  sensitiveOther: false, sensitiveOtherDesc: "",
};

function ToggleRow({
  icon: Icon,
  label,
  value,
  onChange,
  last = false,
}: {
  icon: LucideIcon;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: useContext(GreenCardContext) ? "#3D8A5A20" : t.colors.divider,
      }}
    >
      <Icon size={20} color={t.colors.primary} />
      <Text style={[t.type.body, { flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: t.colors.borderMuted, true: t.colors.primary }}
        thumbColor="#FFFFFF"
        style={{ transform: [{ scaleX: 0.86 }, { scaleY: 0.84 }] }}
      />
    </View>
  );
}

function ToggleCard({ green, children }: { green?: boolean; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <GreenCardContext.Provider value={!!green}>
      <View
        style={{
          backgroundColor: green ? "#3D8A5A10" : t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: green ? "#3D8A5A40" : t.colors.border,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </GreenCardContext.Provider>
  );
}

export default function WizardStep2() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { wizard, setWizard } = useWizard();
  const { params } = useRoute<Route>();
  const [fields, setFields] = useState<Fields>(INITIAL);

  const providerType = params.providerType;
  const isInsurance = providerType === "Insurance";
  const isHospitalOrFacility = providerType === "Hospital" || providerType === "Facility";
  const showSensitive = isInsurance || isHospitalOrFacility;

  const set = (key: keyof Fields) => (value: boolean | string) =>
    setFields(prev => ({ ...prev, [key]: value }));

  const hasRecord = isInsurance
    ? fields.benefitsCoverage || fields.claimsPayment || fields.eligibilityEnrollment || fields.financialBilling
    : isHospitalOrFacility
      ? fields.medicalRecords || fields.dentalRecords || fields.otherNonSpecific
      : fields.historyPhysical || fields.diagnosticResults || fields.treatmentProcedure ||
        fields.prescriptionMedication || fields.imagingRadiology || fields.dischargeSummaries || fields.specificRecords;

  const handleNext = () => {
    setWizard(prev => ({ ...prev, recordsSummary: computeRecordsSummary(fields), fields }));
    nav.navigate(wizard.isEditing ? "WizardStep5" : "WizardStep3");
  };

  return (
    <WizardShell step={2} subtitle="What to Release" primaryLabel="Next →" primaryDisabled={!hasRecord} onPrimary={handleNext}>
      {/* Records to Release */}
      <Text style={t.type.bodyStrong}>
        Records to Release <Text style={{ color: "#EF4444" }}>*</Text>
      </Text>

      {isInsurance && (
        <ToggleCard green>
          <ToggleRow icon={ShieldCheck} label="Benefits and Coverage" value={fields.benefitsCoverage} onChange={set("benefitsCoverage") as (v: boolean) => void} />
          <ToggleRow icon={Receipt} label="Claims and Payment" value={fields.claimsPayment} onChange={set("claimsPayment") as (v: boolean) => void} />
          <ToggleRow icon={UserCheck} label="Eligibility and Enrollment" value={fields.eligibilityEnrollment} onChange={set("eligibilityEnrollment") as (v: boolean) => void} />
          <ToggleRow icon={CreditCard} label="Financial / Billing Information" value={fields.financialBilling} onChange={set("financialBilling") as (v: boolean) => void} last />
        </ToggleCard>
      )}

      {isHospitalOrFacility && (
        <>
          <ToggleCard green>
            <ToggleRow icon={Stethoscope} label="Medical Records" value={fields.medicalRecords} onChange={set("medicalRecords") as (v: boolean) => void} />
            <ToggleRow icon={Smile} label="Dental Records" value={fields.dentalRecords} onChange={set("dentalRecords") as (v: boolean) => void} />
            <ToggleRow icon={FileQuestion} label="Other Non-Specific" value={fields.otherNonSpecific} onChange={set("otherNonSpecific") as (v: boolean) => void} last />
          </ToggleCard>
          {fields.otherNonSpecific && (
            <Input
              label="Other Non-Specific Details"
              placeholder="Provide details..."
              multiline
              value={fields.otherNonSpecificDesc}
              onChangeText={set("otherNonSpecificDesc") as (v: string) => void}
            />
          )}
        </>
      )}

      {!isInsurance && !isHospitalOrFacility && (
        <>
          <ToggleCard green>
            <ToggleRow icon={ClipboardList} label="History & Physical" value={fields.historyPhysical} onChange={set("historyPhysical") as (v: boolean) => void} />
            <ToggleRow icon={Microscope} label="Diagnostic Results" value={fields.diagnosticResults} onChange={set("diagnosticResults") as (v: boolean) => void} />
            <ToggleRow icon={FileText} label="Treatment / Procedure Notes" value={fields.treatmentProcedure} onChange={set("treatmentProcedure") as (v: boolean) => void} />
            <ToggleRow icon={Pill} label="Prescription / Medication" value={fields.prescriptionMedication} onChange={set("prescriptionMedication") as (v: boolean) => void} />
            <ToggleRow icon={Scan} label="Imaging / Radiology" value={fields.imagingRadiology} onChange={set("imagingRadiology") as (v: boolean) => void} />
            <ToggleRow icon={FileCheck} label="Discharge Summaries" value={fields.dischargeSummaries} onChange={set("dischargeSummaries") as (v: boolean) => void} />
            <ToggleRow icon={FileSearch} label="Specific Records" value={fields.specificRecords} onChange={set("specificRecords") as (v: boolean) => void} last />
          </ToggleCard>
          {fields.specificRecords && (
            <Input
              label="Specific Records Description"
              placeholder="Describe specific records needed..."
              multiline
              value={fields.specificRecordsDesc}
              onChangeText={set("specificRecordsDesc") as (v: string) => void}
            />
          )}
        </>
      )}

      {/* Sensitive Information (Insurance + Hospital/Facility only) */}
      {showSensitive && (
        <>
          <Text style={t.type.bodyStrong}>Sensitive Information to be Disclosed</Text>

          <ToggleCard>
            <ToggleRow icon={Activity} label="Communicable Diseases" value={fields.sensitiveCommDiseases} onChange={set("sensitiveCommDiseases") as (v: boolean) => void} />
            <ToggleRow icon={Heart} label="Reproductive Health" value={fields.sensitiveReproductiveHealth} onChange={set("sensitiveReproductiveHealth") as (v: boolean) => void} />
            <ToggleRow icon={Shield} label="HIV/AIDS status or testing results" value={fields.sensitiveHivAids} onChange={set("sensitiveHivAids") as (v: boolean) => void} />
            <ToggleRow icon={Brain} label="Mental Health / Behavior Health records" value={fields.sensitiveMentalHealth} onChange={set("sensitiveMentalHealth") as (v: boolean) => void} />
            <ToggleRow icon={FlaskConical} label="Substance Use Disorder (Alcohol/Drug treatment)" value={fields.sensitiveSubstanceUse} onChange={set("sensitiveSubstanceUse") as (v: boolean) => void} />
            <ToggleRow icon={MessageCircle} label="Psychotherapy Notes" value={fields.sensitivePsychotherapy} onChange={set("sensitivePsychotherapy") as (v: boolean) => void} />
            <ToggleRow icon={FilePlus} label="Other (Specify)" value={fields.sensitiveOther} onChange={set("sensitiveOther") as (v: boolean) => void} last />
          </ToggleCard>
          {fields.sensitiveOther && (
            <Input
              label="Provide details"
              placeholder="Specify..."
              value={fields.sensitiveOtherDesc}
              onChangeText={set("sensitiveOtherDesc") as (v: string) => void}
            />
          )}
        </>
      )}
    </WizardShell>
  );
}
