import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Circle, CheckCircle2, ChevronRight } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { MetricCard } from "@/components/MetricCard";
import { HealthSyncPill } from "@/components/HealthSyncPill";
import { useTheme } from "@/theme/ThemeProvider";
import { getSetupStatus, getHealthData, postHealthData, type SetupStatus, type HealthDataRow } from "@/lib/api";
import { fetchTodayMetrics, getLastHealthSync, recordHealthSync, requestHealthKitAccess } from "@/lib/healthkit";
import { heartRateStatus, spo2Status, sleepStatus } from "@/lib/metricStatus";
import type { HomeParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<HomeParamList>;

type DashboardMetrics = {
  heartRateAvg: number | null;
  sleepMinutes: number | null;
  spo2Avg: number | null;
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
    spo2Avg: find("spo2Avg"),
    steps: find("steps"),
  };
}

function formatSleep(minutes: number | null): string {
  if (minutes === null) return "--";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

/** A reading exists even when it's 0 — distinguish a real 0 from "No data". */
function hasValue(v: number | null | undefined): boolean {
  return v !== null && v !== undefined;
}

export default function Dashboard() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    getLastHealthSync().then((iso) => {
      if (iso) setLastSynced(new Date(iso));
    });
  }, []);

  // Local YYYY-MM-DD — must match the local date healthkit.ts stamps on stored
  // telemetry, or the evening UTC rollover makes the dashboard query "tomorrow".
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  async function syncHealthKit() {
    setSyncing(true);
    try {
      // Silent re-init: covers the case where iOS dropped the HealthKit grant
      // (reinstall, re-sign, user-revoked in Settings) while our server flag
      // still says connected. iOS no-ops if already authorized; surfaces the
      // system prompt only when truly needed.
      try { await requestHealthKitAccess(); } catch { /* user-denied is fine */ }
      const fresh = await fetchTodayMetrics();
      if (fresh.length > 0) {
        await postHealthData(fresh);
      }
      // Record the attempt even when HealthKit returned nothing, so the
      // label reflects "we tried" rather than getting stuck on "Syncing…".
      await recordHealthSync();
      setLastSynced(new Date());
    } catch {
      // Non-fatal — stale data is acceptable
    } finally {
      setSyncing(false);
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

  // Status pills use the same thresholds as the expanded views (see
  // lib/metricStatus) so the card can't say "Normal" while the expanded says
  // "Elevated" for the same value.
  const hrStat = heartRateStatus(metrics?.heartRateAvg);
  const spo2Stat = spo2Status(metrics?.spo2Avg);
  const sleepStat = sleepStatus(metrics?.sleepMinutes);

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

      <HealthSyncPill
        connected={connected}
        syncing={syncing}
        lastSynced={lastSynced}
        onPressDisconnected={() => nav.navigate("ConnectAppleHealth" as never)}
      />


      {/* Today's Overview */}
      <Text style={[t.type.h3, { marginTop: 4 }]}>Today's Overview</Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <MetricCard
          label="HEART RATE"
          value={metrics?.heartRateAvg != null ? String(metrics.heartRateAvg) : "--"}
          unit="bpm"
          status={hrStat.label}
          statusTone={hrStat.tone}
          onPress={() => nav.navigate("CardExpanded", { cardId: "heartRate" })}
        />
        <MetricCard
          label="SpO₂"
          value={metrics?.spo2Avg != null ? String(metrics.spo2Avg) : "--"}
          unit="%"
          status={spo2Stat.label}
          statusTone={spo2Stat.tone}
          onPress={() => nav.navigate("Spo2Expanded")}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <MetricCard
          label="STEPS"
          value={metrics?.steps != null ? metrics.steps.toLocaleString() : "--"}
          unit="steps"
          status={hasValue(metrics?.steps) ? "Active" : "No data"}
          statusTone={hasValue(metrics?.steps) ? "good" : undefined}
          onPress={() => nav.navigate("StepsExpanded")}
        />
        <MetricCard
          label="SLEEP"
          value={formatSleep(metrics?.sleepMinutes ?? null)}
          unit=""
          status={sleepStat.label}
          statusTone={sleepStat.tone}
          onPress={() => nav.navigate("SleepExpanded")}
        />
      </View>
    </Screen>
  );
}
