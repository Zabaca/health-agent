import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { AlertTriangle } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { findPatient, mockPda } from "@/mock/pda";
import type { PdaReleasesParamList } from "@/navigation/types";
import { PdaWizardShell } from "./_PdaWizardShell";

type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

export default function PdaWizardStep4() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { representing } = useRole();
  const patient = findPatient(representing);

  const rows = [
    { label: "Release Code", value: "NP7QR2MX" },
    { label: "Provider", value: "Dr. Sarah Chen, MD" },
    { label: "Record Types", value: "All Records" },
    { label: "Duration", value: "1 year · Exp. Apr 9, 2027" },
    { label: "Representative", value: `You (${mockPda.name})`, tint: true },
  ];

  return (
    <PdaWizardShell
      step={4}
      subtitle="Review & Submit"
      primaryLabel="Submit for Patient Review"
      onPrimary={() => nav.popToTop()}
    >
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          overflow: "hidden",
        }}
      >
        {rows.map((row, i) => (
          <View
            key={row.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 14,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: t.colors.divider,
            }}
          >
            <Text style={[t.type.caption, { flex: 1 }]}>{row.label}</Text>
            <Text style={[t.type.body, { fontWeight: "600", color: row.tint ? t.colors.primary : t.colors.textPrimary }]}>
              {row.value}
            </Text>
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
          <Text style={[t.type.caption, { color: t.colors.accent }]}>
            You cannot sign this release. After submitting, {patient.name} will receive a notification to review and sign before it becomes active.
          </Text>
        </View>
      </View>
    </PdaWizardShell>
  );
}
