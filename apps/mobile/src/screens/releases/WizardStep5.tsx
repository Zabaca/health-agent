import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Pencil } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { ReleasesParamList } from "@/navigation/types";
import { WizardShell } from "./_WizardShell";

type Nav = NativeStackNavigationProp<ReleasesParamList>;

const summary = [
  { label: "Request records from", value: "Mass General Hospital" },
  { label: "Representative", value: "Dr. Sarah Chen" },
  { label: "Records included", value: "All records" },
  { label: "Valid until", value: "Oct 15, 2026 · 90 days" },
];

export default function WizardStep5() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  return (
    <WizardShell step={5} subtitle="Review & Sign" primaryLabel="Create Release" onPrimary={() => nav.popToTop()}>
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: 14,
          gap: 8,
        }}
      >
        <Text style={t.type.bodyStrong}>Release Summary</Text>
        {summary.map((s, i) => (
          <View
            key={s.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 8,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: t.colors.divider,
            }}
          >
            <Text style={[t.type.caption, { flex: 1 }]}>{s.label}</Text>
            <Text style={[t.type.body, { fontWeight: "600", marginRight: 8 }]}>{s.value}</Text>
            {i < summary.length - 1 ? (
              <Pressable><Text style={{ color: t.colors.primary, fontWeight: "600" }}>Edit</Text></Pressable>
            ) : null}
          </View>
        ))}
      </View>

      <Text style={t.type.caption}>
        By signing, you authorize Dr. Sarah Chen to request your health records from Mass General Hospital for the period stated. You may revoke it at any time.
      </Text>

      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: t.colors.borderMuted,
          height: 110,
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <Pencil size={18} color={t.colors.textSecondary} />
        <Text style={t.type.caption}>Draw or tap to sign</Text>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Pressable><Text style={{ color: t.colors.primary, fontWeight: "600" }}>Clear</Text></Pressable>
      </View>
    </WizardShell>
  );
}
