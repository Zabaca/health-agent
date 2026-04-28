import { useState } from "react";
import { Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FileText, FlaskConical, ClipboardList, Pill, Scan, FileCheck } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { recordTypes } from "@/mock/releases";
import type { PdaReleasesParamList } from "@/navigation/types";
import { PdaWizardShell } from "./_PdaWizardShell";

type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

const icons = [FileText, FlaskConical, ClipboardList, Pill, Scan, FileCheck];

export default function PdaWizardStep2() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [allRecords, setAllRecords] = useState(true);
  const [enabled, setEnabled] = useState<Record<number, boolean>>({});

  return (
    <PdaWizardShell
      step={2}
      subtitle="Record Types"
      primaryLabel="Next — Duration"
      onPrimary={() => nav.navigate("PdaWizardStep3")}
    >
      <View
        style={{
          backgroundColor: t.colors.primaryBg,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.primary,
          padding: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <FileCheck size={24} color={t.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={[t.type.bodyStrong, { color: t.colors.primary }]}>All Records</Text>
          <Text style={[t.type.caption, { color: t.colors.primary }]}>Share complete medical history</Text>
        </View>
        <Switch
          value={allRecords}
          onValueChange={setAllRecords}
          trackColor={{ false: t.colors.borderMuted, true: t.colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <Text style={[t.type.caption, { textAlign: "center" }]}>or choose specific types</Text>

      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          overflow: "hidden",
        }}
      >
        {recordTypes.map((label, i) => {
          const Icon = icons[i];
          return (
            <View
              key={label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              <Icon size={20} color={t.colors.textSecondary} />
              <Text style={[t.type.body, { flex: 1 }]}>{label}</Text>
              <Switch
                value={enabled[i] ?? false}
                onValueChange={(v) => setEnabled((s) => ({ ...s, [i]: v }))}
                disabled={allRecords}
                trackColor={{ false: t.colors.borderMuted, true: t.colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>
          );
        })}
      </View>
    </PdaWizardShell>
  );
}
