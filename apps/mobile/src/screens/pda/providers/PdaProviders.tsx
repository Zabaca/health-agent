import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, Plus, Eye, Pencil } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { findPatient } from "@/mock/pda";
import { mockProviders } from "@/mock/providers";
import type { PdaProvidersParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaProvidersParamList>;

export default function PdaProviders() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { representing } = useRole();
  const patient = findPatient(representing);
  const isEditor = patient.permissions.providers === "editor";
  const firstName = patient.name.split(" ")[0];

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[t.type.h1, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          Providers
        </Text>
        {isEditor ? (
          <Pressable hitSlop={8} onPress={() => nav.navigate("PdaAddProvider")}>
            <Plus size={24} color={t.colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <View
        style={{
          backgroundColor: t.colors.primaryBg,
          borderRadius: t.radius.card,
          padding: 14,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        {isEditor ? <Pencil size={16} color={t.colors.primary} /> : <Eye size={16} color={t.colors.primary} />}
        <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
          {isEditor
            ? `Editor access — you can view, add and remove ${firstName}'s providers.`
            : `Viewer access — you can view ${firstName}'s providers but cannot make changes.`}
        </Text>
      </View>

      {mockProviders.slice(0, 2).map((p) => (
        <Pressable key={p.id} onPress={() => nav.navigate("PdaProviderDetail", { providerId: p.id })}>
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
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={t.type.bodyStrong}>{p.physician ?? p.organization}</Text>
              <Text style={t.type.caption}>
                {p.physician
                  ? `${p.specialty ?? (p.type === "Insurance" ? "Insurance" : "Primary Care")} · ${p.organization}`
                  : p.type}
              </Text>
            </View>
            <ChevronRight size={16} color={t.colors.textSecondary} />
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
