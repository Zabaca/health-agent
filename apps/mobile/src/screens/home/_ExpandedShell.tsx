import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, X } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { MetricCard } from "@/components/MetricCard";
import { useTheme } from "@/theme/ThemeProvider";
import { mockUser } from "@/mock/user";
import { dashboardMetrics, type Metric } from "@/mock/health";
import type { HomeParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<HomeParamList>;

const otherMetrics = (focus: Metric): Metric[] =>
  (["heartRate", "sleep", "glucose", "steps"] as Metric[]).filter((m) => m !== focus);

const labelMap: Record<Metric, string> = {
  heartRate: "HEART RATE",
  sleep: "SLEEP",
  glucose: "GLUCOSE",
  steps: "STEPS",
};

const valueLine: Record<Metric, string> = {
  heartRate: "72 bpm",
  sleep: "7h 22m",
  glucose: "94 mg/dL",
  steps: "6,841",
};

const statusFor: Record<Metric, { text: string; tone: "good" | "warn" | "bad" }> = {
  heartRate: { text: "Normal", tone: "good" },
  sleep: { text: "Good", tone: "good" },
  glucose: { text: "Optimal", tone: "good" },
  steps: { text: "68%", tone: "warn" },
};

export function ExpandedShell({
  focus,
  expandedCard,
}: {
  focus: Metric;
  expandedCard: React.ReactNode;
}) {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const others = otherMetrics(focus);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Pressable onPress={() => nav.navigate("Notifications")}>
        <View
          style={{
            backgroundColor: t.colors.primaryBg,
            paddingHorizontal: t.spacing.gutter,
            paddingTop: insets.top + 10,
            paddingBottom: 10,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary }} />
          <Text style={[t.type.caption, { color: t.colors.primary, fontWeight: "500" }]}>
            New lab results available — tap to view
          </Text>
        </View>
      </Pressable>

      <Screen contentContainerStyle={{ gap: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Text style={t.type.caption}>Good morning</Text>
            <Text style={t.type.h1}>{mockUser.firstName}</Text>
          </View>
          <Pressable onPress={() => nav.navigate("Notifications")}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: t.colors.surface,
                borderWidth: 1,
                borderColor: t.colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={20} color={t.colors.textPrimary} />
            </View>
          </Pressable>
        </View>

        <View
          style={{
            backgroundColor: t.colors.primaryBg,
            borderRadius: t.radius.pill,
            paddingVertical: 8,
            paddingHorizontal: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary }} />
          <Text style={[t.type.caption, { color: t.colors.primary, fontWeight: "500" }]}>
            Apple Health connected · Last synced 2 min ago
          </Text>
        </View>

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
          {others.map((m) => (
            <MetricCard
              key={m}
              compact
              label={labelMap[m]}
              value={valueLine[m]}
              status={statusFor[m].text}
              statusTone={statusFor[m].tone}
              onPress={() => {
                if (m === "heartRate") nav.navigate("CardExpanded", { cardId: "heartRate" });
                else if (m === "sleep") nav.navigate("SleepExpanded");
                else if (m === "glucose") nav.navigate("GlucoseExpanded");
                else nav.navigate("StepsExpanded");
              }}
            />
          ))}
        </View>
      </Screen>
    </View>
  );
}

export function TabSelector() {
  const t = useTheme();
  const tabs = ["Today", "Week", "Month"];
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {tabs.map((label, i) => (
        <View
          key={label}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 18,
            borderRadius: t.radius.pill,
            backgroundColor: i === 0 ? t.colors.primary : t.colors.surfaceSubtle,
          }}
        >
          <Text
            style={{
              color: i === 0 ? "#FFFFFF" : t.colors.textSecondary,
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function _useDashboardMetrics() {
  return dashboardMetrics;
}
