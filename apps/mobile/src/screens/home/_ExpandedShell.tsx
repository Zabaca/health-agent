import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { X } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { MetricCard } from "@/components/MetricCard";
import { HealthSyncPill } from "@/components/HealthSyncPill";
import { useTheme } from "@/theme/ThemeProvider";
import { getHealthData, getSetupStatus, type HealthDataRow } from "@/lib/api";
import type { HomeParamList } from "@/navigation/types";
import type { MetricRange } from "@/lib/healthkit";

type Nav = NativeStackNavigationProp<HomeParamList>;

export type Metric = "heartRate" | "sleep" | "glucose" | "steps";

const otherMetrics = (focus: Metric): Metric[] =>
  (["heartRate", "sleep", "glucose", "steps"] as Metric[]).filter((m) => m !== focus);

const labelMap: Record<Metric, string> = {
  heartRate: "HEART RATE",
  sleep: "SLEEP",
  glucose: "GLUCOSE",
  steps: "STEPS",
};

function formatSleepMin(minutes: number | null): string {
  if (minutes === null) return "--";
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return `${h}h ${m}m`;
}

function siblingValue(m: Metric, rows: HealthDataRow[]): { value: string; unit: string } {
  const find = (type: string) => rows.find((r) => r.type === type)?.value ?? null;
  if (m === "heartRate") {
    const v = find("heartRateAvg");
    return { value: v !== null ? String(v) : "--", unit: v !== null ? "bpm" : "" };
  }
  if (m === "sleep") return { value: formatSleepMin(find("sleepMinutes")), unit: "" };
  if (m === "glucose") {
    const v = find("glucoseAvg");
    return { value: v !== null ? String(v) : "--", unit: v !== null ? "mg/dL" : "" };
  }
  const v = find("steps");
  return { value: v !== null ? v.toLocaleString() : "--", unit: v !== null ? "steps" : "" };
}

export function ExpandedShell({
  focus,
  expandedCard,
}: {
  focus: Metric;
  expandedCard: React.ReactNode;
}) {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [firstName, setFirstName] = useState("");
  const [connected, setConnected] = useState(false);
  const [todayRows, setTodayRows] = useState<HealthDataRow[]>([]);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  useEffect(() => {
    Promise.all([getSetupStatus(), getHealthData({ from: today, to: today })])
      .then(([status, rows]) => {
        setFirstName(status.firstName ?? "");
        setConnected(status.healthKitConnected);
        setTodayRows(rows);
      })
      .catch(() => {});
  }, [today]);

  const others = otherMetrics(focus);

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      <View>
        <Text style={t.type.caption}>Good morning</Text>
        <Text style={t.type.h1}>{firstName}</Text>
      </View>

      <HealthSyncPill connected={connected} onPressDisconnected={() => nav.navigate("ConnectAppleHealth" as never)} />

      <Text style={[t.type.h3, { marginTop: 4 }]}>Today's Overview</Text>

      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: 16,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={[t.type.sectionLabel, { color: t.colors.textSecondary }]}>{labelMap[focus]}</Text>
          <Pressable onPress={() => nav.goBack()}>
            <X size={18} color={t.colors.textSecondary} />
          </Pressable>
        </View>
        {expandedCard}
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        {others.map((m) => {
          const { value, unit } = siblingValue(m, todayRows);
          return (
            <MetricCard
              key={m}
              compact
              label={labelMap[m]}
              value={value}
              unit={unit}
              onPress={() => {
                if (m === "heartRate") nav.navigate("CardExpanded", { cardId: "heartRate" });
                else if (m === "sleep") nav.navigate("SleepExpanded");
                else if (m === "glucose") nav.navigate("GlucoseExpanded");
                else nav.navigate("StepsExpanded");
              }}
            />
          );
        })}
      </View>
    </Screen>
  );
}

export function TabSelector({ value, onChange }: { value: MetricRange; onChange: (r: MetricRange) => void }) {
  const t = useTheme();
  const tabs: { id: MetricRange; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
  ];
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 18,
              borderRadius: t.radius.pill,
              backgroundColor: active ? t.colors.primary : t.colors.surfaceSubtle,
            }}
          >
            <Text style={{ color: active ? "#FFFFFF" : t.colors.textSecondary, fontSize: 13, fontWeight: "600" }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
