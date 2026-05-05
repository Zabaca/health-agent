import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Circle, CheckCircle2, ChevronRight } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { MetricCard } from "@/components/MetricCard";
import { useTheme } from "@/theme/ThemeProvider";
import { getSetupStatus, type SetupStatus } from "@/lib/api";
import { dashboardMetrics } from "@/mock/health";
import type { HomeParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<HomeParamList>;

function buildSetupSteps(s: SetupStatus) {
  return [
    { id: "profile", label: "Complete your profile", complete: s.profileComplete },
    { id: "provider", label: "Add a health provider", complete: s.providerAdded },
    { id: "pda", label: "Invite someone to help", complete: s.pdaAdded },
    { id: "release", label: "Create your first release", complete: s.releaseCreated },
  ];
}

export default function Dashboard() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);

  const load = useCallback(async () => {
    try {
      setSetupStatus(await getSetupStatus());
    } catch {
      // silently ignore — stale data is fine for the dashboard
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const steps = setupStatus ? buildSetupSteps(setupStatus) : null;
  const completed = steps ? steps.filter((s) => s.complete).length : 0;
  const firstName = setupStatus?.firstName ?? "";

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
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
          {(steps ?? buildSetupSteps({ firstName: null, profileComplete: false, providerAdded: false, pdaAdded: false, releaseCreated: false })).map((step, i) => (
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
