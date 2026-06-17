import { Alert, Pressable, Text, View } from "react-native";
import { useCallback, useState } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AlertTriangle } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { PdaReleasesParamList } from "@/navigation/types";
import { createRepresentingRelease, type ReleaseProviderInput } from "@/lib/api";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import { PdaWizardShell } from "./_PdaWizardShell";
import { usePdaWizard } from "./_PdaWizardContext";

type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

function displayName(p: { providerType: string; providerName: string; insurance?: string | null }): string {
  return p.providerType === "Insurance" ? (p.insurance ?? p.providerName) : p.providerName;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function PdaWizardStep4() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { wizard, setWizard } = usePdaWizard();
  const { currentPatient } = useRepresentedPatients();
  const [creating, setCreating] = useState(false);

  useFocusEffect(useCallback(() => {
    setWizard(prev => ({ ...prev, isEditing: false }));
  }, [setWizard]));

  const providerDisplayName = wizard.provider ? displayName(wizard.provider) : "—";
  const validUntil = wizard.expiryDate
    ? `${formatDate(wizard.expiryDate)} · ${wizard.durationLabel}`
    : "—";

  function editStep(navigate: () => void) {
    setWizard(prev => ({ ...prev, isEditing: true }));
    navigate();
  }

  const rows: { label: string; value: string; onEdit: () => void }[] = [
    {
      label: "Request records from",
      value: providerDisplayName,
      onEdit: () => editStep(() => nav.navigate("PdaWizardStep1")),
    },
    {
      label: "Records included",
      value: wizard.recordsSummary || "—",
      onEdit: () =>
        editStep(() =>
          nav.navigate("PdaWizardStep2", {
            providerType: wizard.provider?.providerType ?? "",
            providerId: wizard.provider?.id ?? "",
          })
        ),
    },
    {
      label: "Valid until",
      value: validUntil,
      onEdit: () => editStep(() => nav.navigate("PdaWizardStep3")),
    },
    {
      label: "Representative",
      value: "You (as designated agent)",
      onEdit: () => {},
    },
  ];

  async function handleCreate() {
    if (!wizard.provider || !wizard.fields || !wizard.expiryDate || !currentPatient) {
      Alert.alert("Missing Info", "Please go back and complete all steps.");
      return;
    }

    try {
      setCreating(true);

      const providerInput: ReleaseProviderInput = {
        providerName: wizard.provider.providerName || undefined,
        providerType: wizard.provider.providerType,
        insurance: wizard.provider.insurance ?? undefined,
        patientId: wizard.provider.patientId ?? undefined,
        patientMemberId: wizard.provider.patientMemberId ?? undefined,
        groupId: wizard.provider.groupId ?? undefined,
        planName: wizard.provider.planName ?? undefined,
        phone: wizard.provider.phone ?? undefined,
        fax: wizard.provider.fax ?? undefined,
        providerEmail: wizard.provider.providerEmail ?? undefined,
        address: wizard.provider.address ?? undefined,
        membershipIdFront: wizard.provider.membershipIdFront ?? undefined,
        membershipIdBack: wizard.provider.membershipIdBack ?? undefined,
        ...wizard.fields,
        allAvailableDates: true,
        purpose: "At the request of the individual",
      };

      const expiryDateStr = toLocalIsoDate(wizard.expiryDate);

      await createRepresentingRelease(currentPatient.patientId, {
        providers: [providerInput],
        authExpirationDate: expiryDateStr,
      });

      nav.popToTop();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create release. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <PdaWizardShell
      step={4}
      subtitle="Review & Submit"
      primaryLabel={creating ? "Submitting…" : "Send for Signature"}
      primaryTestID="pda-wizard-submit"
      onPrimary={handleCreate}
      primaryDisabled={creating}
    >
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: 14,
          gap: 4,
        }}
      >
        <Text style={[t.type.bodyStrong, { marginBottom: 4 }]}>Release Summary</Text>
        {rows.map((row, i) => (
          <View
            key={row.label}
            style={{
              paddingVertical: 10,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: t.colors.divider,
              gap: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={t.type.caption}>{row.label}</Text>
              {row.label !== "Representative" && (
                <Pressable onPress={row.onEdit} hitSlop={8}>
                  <Text style={{ color: t.colors.primary, fontWeight: "600", fontSize: 13 }}>Edit</Text>
                </Pressable>
              )}
            </View>
            <Text style={[t.type.body, { fontWeight: "600" }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View
        style={{
          backgroundColor: "#FFF6E5",
          borderRadius: t.radius.card,
          padding: 14,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <AlertTriangle size={16} color={t.colors.accent} />
        <View style={{ flex: 1 }}>
          <Text style={[t.type.bodyStrong, { color: t.colors.accent }]}>Patient Signature Required</Text>
          <Text style={[t.type.caption, { color: t.colors.accent, marginTop: 2 }]}>
            You cannot sign this release. After submitting,{" "}
            {currentPatient
              ? `${currentPatient.firstName ?? ""} ${currentPatient.lastName ?? ""}`.trim() || "the patient"
              : "the patient"}{" "}
            will receive a notification to review and sign before it becomes active.
          </Text>
        </View>
      </View>
    </PdaWizardShell>
  );
}
