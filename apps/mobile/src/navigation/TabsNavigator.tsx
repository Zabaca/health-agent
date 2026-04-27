import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Home as HomeIcon, FileText, Send, Stethoscope, User } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { HomeStack } from "./HomeStack";
import { RecordsStack } from "./RecordsStack";
import { ReleasesStack } from "./ReleasesStack";
import { ProvidersStack } from "./ProvidersStack";
import { ProfileStack } from "./ProfileStack";
import type { TabsParamList } from "./types";

const Tabs = createBottomTabNavigator<TabsParamList>();

export function TabsNavigator() {
  const t = useTheme();
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
            route.name === "HomeTab"
              ? HomeIcon
              : route.name === "RecordsTab"
                ? FileText
                : route.name === "ReleasesTab"
                  ? Send
                  : route.name === "ProvidersTab"
                    ? Stethoscope
                    : User;
          return <Icon color={color} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="HomeTab" component={HomeStack} options={{ title: "Home" }} />
      <Tabs.Screen name="RecordsTab" component={RecordsStack} options={{ title: "Records" }} />
      <Tabs.Screen name="ReleasesTab" component={ReleasesStack} options={{ title: "Releases" }} />
      <Tabs.Screen name="ProvidersTab" component={ProvidersStack} options={{ title: "Providers" }} />
      <Tabs.Screen name="ProfileTab" component={ProfileStack} options={{ title: "Profile", popToTopOnBlur: true }} />
    </Tabs.Navigator>
  );
}
