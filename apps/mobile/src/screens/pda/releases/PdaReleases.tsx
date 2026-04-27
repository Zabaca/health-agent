import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, ChevronRight, Info } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/theme/ThemeProvider";
import type { PdaReleasesParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

const releases = [
  { id: "rel1", provider: "Valley Medical Center", types: "Labs, Imaging", expiry: "Dec 31, 2026", status: "active" as const },
  { id: "rel2", provider: "Heart Care Clinic", types: "All Records", expiry: "Jun 30, 2026", status: "pending" as const },
];

export default function PdaReleases() {
  const t = useTheme();
  const nav = useNavigation<Nav>();

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[t.type.h1, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          HIPAA Releases
        </Text>
        <Pressable hitSlop={8} onPress={() => nav.navigate("PdaWizardStep1")}>
          <Plus size={24} color={t.colors.primary} />
        </Pressable>
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
        <Info size={16} color={t.colors.primary} />
        <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
          Showing releases where you are designated as the representative.
        </Text>
      </View>

      {releases.map((r) => (
        <Pressable key={r.id} onPress={() => nav.navigate("PdaReleaseDetail", { releaseId: r.id })}>
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
              <Badge label={r.status === "active" ? "Active" : "Pending Signature"} variant={r.status === "active" ? "success" : "accent"} />
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={t.type.caption}>{r.types} · Expires {r.expiry}</Text>
              <ChevronRight size={16} color={t.colors.textSecondary} />
            </View>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
