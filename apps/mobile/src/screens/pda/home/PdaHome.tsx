import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronDown, ChevronRight, FileText, Stethoscope, Send } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { findPatient } from "@/mock/pda";
import type { PdaHomeParamList, PdaProfileParamList, PdaTabsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaHomeParamList & PdaTabsParamList & PdaProfileParamList>;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function PdaHome() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { representing } = useRole();
  const patient = findPatient(representing);

  const accessRows = [
    { id: "records", label: "Health Records", Icon: FileText, value: patient.permissions.records, target: "PdaRecordsTab" as const },
    { id: "providers", label: "Manage Providers", Icon: Stethoscope, value: patient.permissions.providers, target: "PdaProvidersTab" as const },
    { id: "releases", label: "HIPAA Releases", Icon: Send, value: patient.permissions.releases, target: "PdaReleasesTab" as const },
  ];

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[t.type.h1, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          Overview
        </Text>
        <Pressable
          onPress={() => {
            const parent = nav.getParent() as { navigate: (name: string, params?: object) => void } | undefined;
            parent?.navigate("PdaProfileTab", { screen: "PdaPeopleIRepresent" });
          }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: t.radius.pill,
            backgroundColor: t.colors.primaryBg,
          }}
        >
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>{patient.name.split(" ")[0]} {patient.name.split(" ")[1][0]}.</Text>
          <ChevronDown size={16} color={t.colors.primary} />
        </Pressable>
      </View>

      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.primaryBg, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: t.colors.primary, fontWeight: "700" }}>{patient.initials}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={t.type.bodyStrong}>{patient.name}</Text>
          <Text style={t.type.caption}>DOB: {patient.dob}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.primary }} />
            <Text style={[t.type.caption, { color: t.colors.primary, fontWeight: "500" }]}>
              {patient.relationship}
            </Text>
          </View>
        </View>
      </View>

      <View>
        <Text style={[t.type.sectionLabel, { textTransform: "uppercase", marginBottom: 8 }]}>YOUR ACCESS</Text>
        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.border,
            overflow: "hidden",
          }}
        >
          {accessRows.map((row, i) => (
            <Pressable
              key={row.id}
              onPress={() => nav.getParent()?.navigate(row.target as never)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              <row.Icon size={18} color={t.colors.primary} />
              <Text style={[t.type.body, { flex: 1 }]}>{row.label}</Text>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  borderRadius: t.radius.pill,
                  backgroundColor: row.value === "editor" ? t.colors.primaryBg : t.colors.surfaceSubtle,
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: "600", color: row.value === "editor" ? t.colors.primary : t.colors.textSecondary }}>
                  {cap(row.value)}
                </Text>
              </View>
              <ChevronRight size={16} color={t.colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
