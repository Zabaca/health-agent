import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Circle, ChevronRight } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { MetricCard } from "@/components/MetricCard";
import { useTheme } from "@/theme/ThemeProvider";
import { mockUser } from "@/mock/user";
import { dashboardMetrics, accountSetupSteps } from "@/mock/health";
import type { HomeParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<HomeParamList>;

export default function Dashboard() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const completed = accountSetupSteps.filter((s) => s.complete).length;

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      {/* Greeting */}
      <View>
        <Text style={t.type.caption}>Good morning</Text>
        <Text style={t.type.h1}>{mockUser.firstName}</Text>
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
            <Text style={t.type.caption}>{completed} of {accountSetupSteps.length} complete</Text>
          </View>
          {accountSetupSteps.map((step, i) => (
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
              <Circle size={18} color={t.colors.borderMuted} />
              <Text style={[t.type.body, { flex: 1 }]}>{step.label}</Text>
              <ChevronRight size={18} color={t.colors.textSecondary} />
            </View>
          ))}
        </View>
      </Pressable>

      {/* Apple Health pill */}
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
          Apple Health connected · Last synced 2 min ago
        </Text>
      </View>

      {/* Today's Overview */}
      <Text style={[t.type.h3, { marginTop: 4 }]}>Today's Overview</Text>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <MetricCard
          label="HEART RATE"
          value={dashboardMetrics.heartRate.value}
          unit={dashboardMetrics.heartRate.unit}
          status={dashboardMetrics.heartRate.status}
          statusTone={dashboardMetrics.heartRate.statusTone}
          onPress={() => nav.navigate("CardExpanded", { cardId: "heartRate" })}
        />
        <MetricCard
          label="SLEEP"
          value={dashboardMetrics.sleep.value}
          unit={dashboardMetrics.sleep.unit}
          status={dashboardMetrics.sleep.status}
          statusTone={dashboardMetrics.sleep.statusTone}
          onPress={() => nav.navigate("SleepExpanded")}
        />
      </View>
      <View style={{ flexDirection: "row", gap: 12 }}>
        <MetricCard
          label="GLUCOSE"
          value={dashboardMetrics.glucose.value}
          unit={dashboardMetrics.glucose.unit}
          status={dashboardMetrics.glucose.status}
          statusTone={dashboardMetrics.glucose.statusTone}
          onPress={() => nav.navigate("GlucoseExpanded")}
        />
        <MetricCard
          label="STEPS"
          value={dashboardMetrics.steps.value}
          unit={dashboardMetrics.steps.unit}
          status={dashboardMetrics.steps.status}
          statusTone={dashboardMetrics.steps.statusTone}
          onPress={() => nav.navigate("StepsExpanded")}
        />
      </View>
    </Screen>
  );
}
