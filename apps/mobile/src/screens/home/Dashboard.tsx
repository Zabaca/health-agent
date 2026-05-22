import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Circle, CheckCircle2, ChevronRight, Heart } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { MetricCard } from "@/components/MetricCard";
import { useTheme } from "@/theme/ThemeProvider";
import { getSetupStatus, getHealthData, postHealthData, type SetupStatus, type HealthDataRow } from "@/lib/api";
import { fetchTodayMetrics, recordHealthSync } from "@/lib/healthkit";
import type { HomeParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<HomeParamList>;

type DashboardMetrics = {
  heartRateAvg: number | null;
  sleepMinutes: number | null;
  glucoseAvg: number | null;
  steps: number | null;
};

function buildSetupSteps(s: SetupStatus) {
  return [
    { id: "profile", label: "Complete your profile", complete: s.profileComplete },
    { id: "provider", label: "Add a health provider", complete: s.providerAdded },
    { id: "pda", label: "Invite someone to help", complete: s.pdaAdded },
    { id: "release", label: "Create your first release", complete: s.releaseCreated },
    { id: "healthkit", label: "Connect Apple Health", complete: s.healthKitConnected },
  ];
}

function rowsToMetrics(rows: HealthDataRow[]): DashboardMetrics {
  const find = (type: string) => rows.find((r) => r.type === type)?.value ?? null;
  return {
    heartRateAvg: find("heartRateAvg"),
    sleepMinutes: find("sleepMinutes"),
    glucoseAvg: find("glucoseAvg"),
    steps: find("steps"),
  };
}

function formatSleep(minutes: number | null): string {
  if (minutes === null) return "--";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

export default function Dashboard() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  async function syncHealthKit() {
    try {
      const fresh = await fetchTodayMetrics();
      if (fresh.length > 0) {
        await postHealthData(fresh);
        setLastSynced(new Date());
      }
      // Record the attempt even when HealthKit returned nothing.
      await recordHealthSync();
    } catch {
      // Non-fatal — stale data is acceptable
    }
  }

  const load = useCallback(async (withSync = false) => {
    try {
      const [status, rows] = await Promise.all([
        getSetupStatus(),
        getHealthData({ from: today, to: today }),
      ]);
      setSetupStatus(status);
      setMetrics(rowsToMetrics(rows));
      if (withSync && status.healthKitConnected) {
        await syncHealthKit();
        const refreshed = await getHealthData({ from: today, to: today });
        setMetrics(rowsToMetrics(refreshed));
      }
    } catch {
      // silently ignore — stale data is fine for the dashboard
    }
  }, [today]);

  useFocusEffect(useCallback(() => {
    load(true);
  }, [load]));

  async function onRefresh() {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }

  const steps = setupStatus ? buildSetupSteps(setupStatus) : null;
  const completed = steps ? steps.filter((s) => s.complete).length : 0;
  const firstName = setupStatus?.firstName ?? "";
  const connected = setupStatus?.healthKitConnected ?? false;

  function syncLabel() {
    if (!lastSynced) return "Syncing...";
    const diffMin = Math.round((Date.now() - lastSynced.getTime()) / 60000);
    if (diffMin < 1) return "Synced just now";
    if (diffMin === 1) return "Synced 1 min ago";
    return `Synced ${diffMin} min ago`;
  }

  return (
    <Screen
      safeTop
      contentContainerStyle={{ gap: 16 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Greeting */}
      <View>
        <Text style={t.type.caption}>Good morning</Text>
        <Text style={t.type.h1}>{firstName}</Text>
      </View>

      {/* Account Setup */}
      <Pressable onPress={() => nav.navigate("AccountSetup")}>
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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={t.type.bodyStrong}>Account Setup</Text>
            {steps ? (
              <Text style={t.type.caption}>{completed} of {steps.length} complete</Text>
            ) : (
              <ActivityIndicator size="small" color={t.colors.textSecondary} />
            )}
          </View>
          {(steps ?? buildSetupSteps({ firstName: null, profileComplete: false, providerAdded: false, pdaAdded: false, releaseCreated: false, healthKitConnected: false })).map((step, i) => (
            <View
              key={step.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingVertical: 8,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              {step.complete ? (
                <CheckCircle2 size={18} color={t.colors.primary} />
              ) : (
                <Circle size={18} color={t.colors.borderMuted} />
              )}
              <Text style={[t.type.body, { flex: 1 }, step.complete && { color: t.colors.textSecondary }]}>
                {step.label}
              </Text>
              <ChevronRight size={18} color={t.colors.textSecondary} />
            </View>
          ))}
        </View>
      </Pressable>

      {/* Apple Health status pill */}
      {connected ? (
        <View
          style={{
            backgroundColor: t.colors.primaryBg,
            borderRadius: t.radius.pill,
            paddingVertical: 8,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            alignSelf: "stretch",
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary }} />
          <Text style={[t.type.caption, { color: t.colors.primary, fontWeight: "500" }]}>
            Apple Health connected · {syncLabel()}
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={() => nav.navigate("ConnectAppleHealth" as never)}
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.pill,
            paddingVertical: 8,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            alignSelf: "stretch",
            borderWidth: 1,
            borderColor: t.colors.border,
          }}
        >
          <Heart size={14} color={t.colors.textSecondary} />
          <Text style={[t.type.caption, { color: t.colors.textSecondary, fontWeight: "500", flex: 1 }]}>
            Connect Apple Health to see your vitals
          </Text>
          <ChevronRight size={14} color={t.colors.textSecondary} />
        </Pressable>
      )}

      {/* Today's Overview */}
      <Text style={[t.type.h3, { marginTop: 4 }]}>Today's Overview</Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <MetricCard
          label="HEART RATE"
          value={metrics?.heartRateAvg !== null && metrics?.heartRateAvg !== undefined ? String(metrics.heartRateAvg) : "--"}
          unit="bpm"
          status={metrics?.heartRateAvg ? "Normal" : "No data"}
          statusTone={metrics?.heartRateAvg ? "good" : undefined}
          onPress={() => nav.navigate("CardExpanded", { cardId: "heartRate" })}
        />
        <MetricCard
          label="SLEEP"
          value={formatSleep(metrics?.sleepMinutes ?? null)}
          unit=""
          status={metrics?.sleepMinutes ? "Good" : "No data"}
          statusTone={metrics?.sleepMinutes ? "good" : undefined}
          onPress={() => nav.navigate("SleepExpanded")}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <MetricCard
          label="GLUCOSE"
          value={metrics?.glucoseAvg !== null && metrics?.glucoseAvg !== undefined ? String(metrics.glucoseAvg) : "--"}
          unit="mg/dL"
          status={metrics?.glucoseAvg ? "Normal" : "No data"}
          statusTone={metrics?.glucoseAvg ? "good" : undefined}
          onPress={() => nav.navigate("GlucoseExpanded")}
        />
        <MetricCard
          label="STEPS"
          value={metrics?.steps !== null && metrics?.steps !== undefined ? metrics.steps.toLocaleString() : "--"}
          unit="steps"
          status={metrics?.steps ? "Active" : "No data"}
          statusTone={metrics?.steps ? "good" : undefined}
          onPress={() => nav.navigate("StepsExpanded")}
        />
      </View>
    </Screen>
  );
}
