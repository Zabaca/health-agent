import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, Search, Calendar, ChevronRight, ListChecks, ClipboardList, User, Stethoscope } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/theme/ThemeProvider";
import { mockReleases, type ReleaseStatus } from "@/mock/releases";
import { mockUser } from "@/mock/user";
import type { ReleasesParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ReleasesParamList>;
type ParentNav = { navigate: (name: string, params?: object) => void } | undefined;

const tabs: { id: ReleaseStatus; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "expired", label: "Expired" },
];

export default function ReleasesList() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [tab, setTab] = useState<ReleaseStatus>("active");

  const setupIncomplete = !mockUser.setupComplete;
  const noReleases = mockReleases.length === 0;

  const goToProfileEdit = () => {
    const parent = nav.getParent() as ParentNav;
    parent?.navigate("ProfileTab", { screen: "EditProfile" });
  };
  const goToProvidersTab = () => {
    const parent = nav.getParent() as ParentNav;
    parent?.navigate("ProvidersTab");
  };

  const headerRow = (
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
        disabled={setupIncomplete}
        onPress={() => nav.navigate("WizardStep1")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: setupIncomplete ? t.colors.textSecondary : t.colors.primary,
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: t.radius.pill,
          opacity: setupIncomplete ? 0.7 : 1,
        }}
      >
        <Plus size={16} color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>New Release</Text>
      </Pressable>
    </View>
  );

  if (setupIncomplete) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <EmptyState
          icon={<ListChecks size={32} color="#92400E" />}
          iconBg="#FEF3C7"
          title="Complete your account first"
          subtitle="Finish the mandatory setup before requesting a HIPAA release: complete your profile and add a health provider."
          actions={[
            {
              label: "Complete Profile",
              icon: <User size={16} color="#FFFFFF" />,
              onPress: goToProfileEdit,
            },
            {
              label: "Add Health Provider",
              icon: <Stethoscope size={16} color={t.colors.textPrimary} />,
              variant: "secondary",
              onPress: goToProvidersTab,
            },
          ]}
        />
      </Screen>
    );
  }

  if (noReleases) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <EmptyState
          icon={<ClipboardList size={32} color={t.colors.textSecondary} />}
          title="No releases yet"
          subtitle="Create your first HIPAA release to authorize a provider to share your records."
          actions={[
            {
              label: "Create Your First Release",
              icon: <Plus size={16} color="#FFFFFF" />,
              onPress: () => nav.navigate("WizardStep1"),
            },
          ]}
        />
      </Screen>
    );
  }

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      {headerRow}

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
