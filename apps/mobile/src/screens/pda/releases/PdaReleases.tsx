import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, ChevronRight, Info, ShieldOff, ClipboardList, Eye } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { findPatient } from "@/mock/pda";
import type { PdaReleasesParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

const releases = [
  { id: "rel1", provider: "Valley Medical Center", types: "Labs, Imaging", expiry: "Dec 31, 2026", status: "active" as const },
  { id: "rel2", provider: "Heart Care Clinic", types: "All Records", expiry: "Jun 30, 2026", status: "pending" as const },
];

export default function PdaReleases() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { representing } = useRole();
  const patient = findPatient(representing);
  const perm = patient.permissions.releases;
  const isEditor = perm === "editor";
  const firstName = patient.name.split(" ")[0];
  const items = releases;
  const empty = items.length === 0;

  const headerRow = (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={[t.type.h1, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        HIPAA Releases
      </Text>
      {isEditor ? (
        <Pressable hitSlop={8} onPress={() => nav.navigate("PdaWizardStep1")}>
          <Plus size={24} color={t.colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );

  if (perm === "none") {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <EmptyState
          icon={<ShieldOff size={32} color={t.colors.textSecondary} />}
          title="No access to releases"
          subtitle={`${patient.name} hasn't granted you access to HIPAA releases. Ask them to update your permissions from their account settings.`}
        />
      </Screen>
    );
  }

  if (empty) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <EmptyState
          icon={<ClipboardList size={32} color={t.colors.primary} />}
          iconBg={t.colors.primaryBg}
          title="No releases yet"
          subtitle={`Create your first HIPAA release on ${firstName}'s behalf to authorize a provider to share records.`}
          actions={
            isEditor
              ? [
                  {
                    label: "Create Release",
                    icon: <Plus size={16} color="#FFFFFF" />,
                    onPress: () => nav.navigate("PdaWizardStep1"),
                  },
                ]
              : []
          }
        />
      </Screen>
    );
  }

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      {headerRow}

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
        {isEditor ? <Info size={16} color={t.colors.primary} /> : <Eye size={16} color={t.colors.primary} />}
        <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
          {isEditor
            ? "Showing releases where you are designated as the representative."
            : `Viewer access — you can view ${firstName}'s releases but cannot create or revoke.`}
        </Text>
      </View>

      {items.map((r) => (
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
