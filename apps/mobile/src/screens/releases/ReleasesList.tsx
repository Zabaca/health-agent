import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, Search, Calendar, ChevronRight } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/theme/ThemeProvider";
import { mockReleases, type ReleaseStatus } from "@/mock/releases";
import type { ReleasesParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ReleasesParamList>;

const tabs: { id: ReleaseStatus; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "expired", label: "Expired" },
];

export default function ReleasesList() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [tab, setTab] = useState<ReleaseStatus>("active");

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text
          style={[t.type.h1, { flex: 1 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          My Releases
        </Text>
        <Pressable
          onPress={() => nav.navigate("WizardStep1")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: t.colors.primary,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: t.radius.pill,
          }}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>New Release</Text>
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.button,
          borderWidth: 1,
          borderColor: t.colors.border,
          paddingHorizontal: 14,
          height: 44,
        }}
      >
        <Search size={18} color={t.colors.textSecondary} />
        <Text style={[t.type.body, { color: t.colors.textPlaceholder, flex: 1 }]}>Search provider or release code...</Text>
        <Pressable onPress={() => nav.navigate("DateFilterSheet")}>
          <Calendar size={18} color={t.colors.textSecondary} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {tabs.map((s) => {
          const on = s.id === tab;
          return (
            <Pressable key={s.id} onPress={() => setTab(s.id)}>
              <View
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 18,
                  borderRadius: t.radius.pill,
                  backgroundColor: on ? t.colors.primary : "transparent",
                  borderWidth: 1,
                  borderColor: on ? t.colors.primary : t.colors.border,
                }}
              >
                <Text style={{ color: on ? "#FFFFFF" : t.colors.textPrimary, fontSize: 13, fontWeight: "600" }}>{s.label}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 10 }}>
        {mockReleases.map((r) => {
          const variant = r.status === "active" ? "success" : r.status === "pending" ? "accent" : "muted";
          const onPress = () => {
            if (r.status === "pending") nav.navigate("PendingDetail", { releaseId: r.id });
            else nav.navigate("ActiveDetail", { releaseId: r.id });
          };
          return (
            <Pressable key={r.id} onPress={onPress}>
              <View
                style={{
                  backgroundColor: t.colors.surface,
                  borderRadius: t.radius.card,
                  borderWidth: 1,
                  borderColor: t.colors.border,
                  padding: 14,
                  gap: 6,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={t.type.bodyStrong}>{r.provider}</Text>
                  <Badge label={r.status === "active" ? "Active" : r.status === "pending" ? "Pending" : "Expired"} variant={variant} />
                </View>
                <Text style={t.type.caption}>
                  {r.representative === "Self-requested" ? "Self-requested" : `Representative: ${r.representative}`}
                </Text>
                <Text style={[t.type.caption, { fontFamily: "Courier" }]}>{r.code}</Text>
                {r.status === "pending" ? (
                  <Text style={{ color: t.colors.accent, fontSize: 13, fontWeight: "500" }}>Awaiting signature</Text>
                ) : r.status === "expired" ? (
                  <Text style={t.type.caption}>Expired {r.expiredOn}</Text>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                    <Text style={t.type.caption}>Valid until {r.validUntil}</Text>
                    <ChevronRight size={16} color={t.colors.textSecondary} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
