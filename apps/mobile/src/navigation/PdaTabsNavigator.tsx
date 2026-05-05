import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home as HomeIcon, FileText, Stethoscope, Send, User } from "lucide-react-native";
import { ThemeProvider, useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { listRepresentedPatients } from "@/lib/api";
import { PdaHomeStack } from "./PdaHomeStack";
import { PdaRecordsStack } from "./PdaRecordsStack";
import { PdaProvidersStack } from "./PdaProvidersStack";
import { PdaReleasesStack } from "./PdaReleasesStack";
import { PdaProfileStack } from "./PdaProfileStack";
import type { PdaTabsParamList } from "./types";

const Tabs = createBottomTabNavigator<PdaTabsParamList>();

function usePdaAccessGuard() {
  const { switchTo } = useRole();
  const backgroundedAt = useRef<number | null>(null);

  const check = async () => {
    try {
      const patients = await listRepresentedPatients();
      if (patients.length === 0) switchTo("patient");
    } catch {}
  };

  useEffect(() => {
    void check();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "background") {
        backgroundedAt.current = Date.now();
        return;
      }
      if (state === "active") void check();
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

function PdaTabsInner() {
  const t = useTheme();
  usePdaAccessGuard();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        tabBarStyle: {
          backgroundColor: t.colors.surface,
          borderTopColor: t.colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const Icon =
            route.name === "PdaHomeTab"
              ? HomeIcon
              : route.name === "PdaRecordsTab"
                ? FileText
                : route.name === "PdaProvidersTab"
                  ? Stethoscope
                  : route.name === "PdaReleasesTab"
                    ? Send
                    : User;
          return <Icon color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="PdaHomeTab" component={PdaHomeStack} options={{ title: "Home" }} />
      <Tabs.Screen name="PdaRecordsTab" component={PdaRecordsStack} options={{ title: "Records" }} />
      <Tabs.Screen name="PdaProvidersTab" component={PdaProvidersStack} options={{ title: "Providers" }} />
      <Tabs.Screen name="PdaReleasesTab" component={PdaReleasesStack} options={{ title: "Releases" }} />
      <Tabs.Screen name="PdaProfileTab" component={PdaProfileStack} options={{ title: "Profile" }} />
    </Tabs.Navigator>
  );
}

export function PdaTabsNavigator() {
  return (
    <ThemeProvider variant="pda">
      <PdaTabsInner />
    </ThemeProvider>
  );
}
