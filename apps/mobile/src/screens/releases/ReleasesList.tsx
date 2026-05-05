import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, Search, SlidersHorizontal, ChevronRight, ListChecks, ClipboardList } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/theme/ThemeProvider";
import { listReleases, getSetupStatus, type ReleaseSummary, type SetupStatus } from "@/lib/api";
import type { ReleasesFilter, ReleasesParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ReleasesParamList>;
type R = RouteProp<ReleasesParamList, "ReleasesList">;
type ParentNav = { navigate: (name: string, params?: object) => void } | undefined;

type ReleaseStatus = "active" | "pending" | "expired";

function computeStatus(r: ReleaseSummary): ReleaseStatus {
  if (r.voided) return "expired";
  if (!r.authSignatureImage) return "pending";
  if (r.authExpirationDate && new Date(r.authExpirationDate) < new Date()) return "expired";
  return "active";
}

function providerDisplayName(r: ReleaseSummary): string {
  if (!r.providerType) return "—";
  return r.providerType === "Insurance" ? (r.insurance ?? r.providerName ?? "—") : (r.providerName ?? "—");
}

function representativeLabel(r: ReleaseSummary): string {
  if (!r.releaseAuthAgent) return "Self-requested";
  return r.authAgentName ?? "Representative";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function SetupBanner({
  profileComplete,
  providerAdded,
  onProfile,
  onProviders,
}: {
  profileComplete: boolean;
  providerAdded: boolean;
  onProfile: () => void;
  onProviders: () => void;
}) {
  const t = useTheme();
  const subtitle = !profileComplete && !providerAdded
    ? "Finish your profile and add a health provider first."
    : !profileComplete
    ? "Finish your profile before creating releases."
    : "Add a health provider before creating releases.";
  return (
    <View
      style={{
        backgroundColor: t.colors.primaryBg,
        borderRadius: t.radius.card,
        borderWidth: 1,
        borderColor: t.colors.primary,
        padding: 14,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 8 }}>
        <ListChecks size={18} color={t.colors.primary} style={{ marginTop: 1 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: t.colors.primary, fontWeight: "600", fontSize: 14 }}>Complete setup to create releases</Text>
          <Text style={{ color: t.colors.primary, fontSize: 13 }}>{subtitle}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {!profileComplete && (
          <Pressable
            onPress={onProfile}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 8,
              backgroundColor: t.colors.primary, alignItems: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 13 }}>Complete Profile</Text>
          </Pressable>
        )}
        {!providerAdded && (
          <Pressable
            onPress={onProviders}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: 8,
              borderWidth: 1, borderColor: t.colors.primary, alignItems: "center",
            }}
          >
            <Text style={{ color: t.colors.primary, fontWeight: "600", fontSize: 13 }}>Add Provider</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const TABS: { id: ReleaseStatus; label: string }[] = [
  { id: "active", label: "Active" },
  { id: "pending", label: "Pending" },
  { id: "expired", label: "Expired" },
];

export default function ReleasesList() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const routeFilters = params?.filters;

  const [tab, setTab] = useState<ReleaseStatus>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [releases, setReleases] = useState<ReleaseSummary[]>([]);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync tab when a status filter is applied from the filter sheet
  useEffect(() => {
    if (routeFilters?.status) {
      setTab(routeFilters.status);
    }
  }, [routeFilters?.status]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summaries, status] = await Promise.all([
        listReleases().catch(() => [] as ReleaseSummary[]),
        getSetupStatus().catch(() => null),
      ]);
      setSetupStatus(status);
      setReleases(summaries);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const hasDateFilter = !!(routeFilters?.dateFrom || routeFilters?.dateTo);
  const isFilterActive = tab !== "active" || hasDateFilter;

  function applyFilters(list: ReleaseSummary[]): ReleaseSummary[] {
    let result = list.filter(r => computeStatus(r) === tab);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        providerDisplayName(r).toLowerCase().includes(q) ||
        (r.releaseCode ?? "").toLowerCase().includes(q) ||
        representativeLabel(r).toLowerCase().includes(q)
      );
    }

    if (routeFilters?.dateFrom || routeFilters?.dateTo) {
      const from = routeFilters.dateFrom ? new Date(routeFilters.dateFrom).getTime() : -Infinity;
      const to = routeFilters.dateTo
        ? new Date(routeFilters.dateTo + "T23:59:59").getTime()
        : Infinity;
      result = result.filter(r => {
        const created = new Date(r.createdAt).getTime();
        return created >= from && created <= to;
      });
    }

    return result;
  }

  const setupIncomplete = loading ? null : setupStatus === null ? false : !(setupStatus.profileComplete && setupStatus.providerAdded);
  const filtered = applyFilters(releases);

  const goToProfileEdit = () => {
    const parent = nav.getParent() as ParentNav;
    parent?.navigate("ProfileTab", { screen: "EditProfile" });
  };
  const goToProvidersTab = () => {
    const parent = nav.getParent() as ParentNav;
    parent?.navigate("ProvidersTab");
  };

  const newReleaseDisabled = setupIncomplete !== false;

  const currentFilters: ReleasesFilter = {
    dateFrom: routeFilters?.dateFrom ?? null,
    dateTo: routeFilters?.dateTo ?? null,
    status: routeFilters?.status ?? tab,
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
        disabled={newReleaseDisabled}
        onPress={() => nav.navigate("WizardStep1")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          backgroundColor: newReleaseDisabled ? t.colors.textSecondary : t.colors.primary,
          paddingVertical: 8,
          paddingHorizontal: 14,
          borderRadius: t.radius.pill,
          opacity: newReleaseDisabled ? 0.7 : 1,
        }}
      >
        <Plus size={16} color="#FFFFFF" />
        <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>New Release</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={t.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (releases.length === 0) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        {setupIncomplete ? (
          <EmptyState
            icon={<ClipboardList size={32} color={t.colors.primary} />}
            iconBg={t.colors.primaryBg}
            title="Complete setup to create releases"
            subtitle={
              !setupStatus?.profileComplete && !setupStatus?.providerAdded
                ? "Finish your profile and add a health provider before creating your first HIPAA release."
                : !setupStatus?.profileComplete
                ? "Finish your profile before creating releases."
                : "Add a health provider before creating releases."
            }
            actions={[
              ...(!setupStatus?.profileComplete ? [{
                label: "Complete Profile",
                icon: <Plus size={16} color="#FFFFFF" />,
                onPress: goToProfileEdit,
              }] : []),
              ...(!setupStatus?.providerAdded ? [{
                label: "Add Provider",
                variant: "secondary" as const,
                onPress: goToProvidersTab,
              }] : []),
            ]}
          />
        ) : (
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
        )}
      </Screen>
    );
  }

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      {headerRow}

      {setupIncomplete && (
        <SetupBanner
          profileComplete={setupStatus?.profileComplete ?? false}
          providerAdded={setupStatus?.providerAdded ?? false}
          onProfile={goToProfileEdit}
          onProviders={goToProvidersTab}
        />
      )}

      <View style={{ flexDirection: "row", gap: 10 }}>
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            height: 44,
            paddingHorizontal: 14,
            backgroundColor: t.colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          <Search size={16} color={t.colors.textSecondary} />
          <TextInput
            style={{ flex: 1, fontSize: 13, color: t.colors.textPrimary, paddingVertical: 0 }}
            placeholder="Search provider or release code..."
            placeholderTextColor={t.colors.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <Pressable
          onPress={() => nav.navigate("DateFilterSheet", { current: currentFilters })}
          style={{
            width: 44,
            height: 44,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: t.colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          <SlidersHorizontal size={18} color={t.colors.primary} />
          {isFilterActive && (
            <View
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: t.colors.primary,
              }}
            />
          )}
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 8 }}>
        {TABS.map((s) => {
          const on = s.id === tab;
          const count = releases.filter(r => computeStatus(r) === s.id).length;
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
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Text style={{ color: on ? "#FFFFFF" : t.colors.textPrimary, fontSize: 13, fontWeight: "600" }}>{s.label}</Text>
                {count > 0 && (
                  <View style={{
                    backgroundColor: on ? "rgba(255,255,255,0.3)" : t.colors.borderMuted,
                    borderRadius: 10, minWidth: 18, height: 18,
                    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
                  }}>
                    <Text style={{ color: on ? "#FFFFFF" : t.colors.textSecondary, fontSize: 11, fontWeight: "600" }}>{count}</Text>
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {filtered.length === 0 ? (
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <Text style={[t.type.body, { color: t.colors.textSecondary }]}>
            {searchQuery || hasDateFilter ? "No matching releases" : `No ${tab} releases`}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {filtered.map((r) => {
            const status = computeStatus(r);
            const variant = status === "active" ? "success" : status === "pending" ? "accent" : "muted";
            const onPress = () => {
              if (status === "pending") nav.navigate("PendingDetail", { releaseId: r.id });
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
                    <Text style={[t.type.bodyStrong, { flex: 1, marginRight: 8 }]} numberOfLines={1}>
                      {providerDisplayName(r)}
                    </Text>
                    <Badge
                      label={status === "active" ? "Active" : status === "pending" ? "Pending" : "Expired"}
                      variant={variant}
                    />
                  </View>
                  <Text style={t.type.caption}>
                    {representativeLabel(r) === "Self-requested"
                      ? "Self-requested"
                      : `Representative: ${representativeLabel(r)}`}
                  </Text>
                  {r.releaseCode ? (
                    <Text style={[t.type.caption, { fontFamily: "Courier" }]}>{r.releaseCode}</Text>
                  ) : null}
                  {status === "pending" ? (
                    <Text style={{ color: t.colors.accent, fontSize: 13, fontWeight: "500" }}>Awaiting signature</Text>
                  ) : status === "expired" ? (
                    <Text style={t.type.caption}>
                      {r.voided ? "Voided" : r.authExpirationDate ? `Expired ${formatDate(r.authExpirationDate)}` : "Expired"}
                    </Text>
                  ) : (
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={t.type.caption}>
                        Valid until {r.authExpirationDate ? formatDate(r.authExpirationDate) : "—"}
                      </Text>
                      <ChevronRight size={16} color={t.colors.textSecondary} />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
