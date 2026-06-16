import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { CommonActions } from "@react-navigation/native";
import { Home as HomeIcon, FileText, Send, Stethoscope, User } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { CenteredTabBar } from "@/components/CenteredTabBar";
import { HomeStack } from "./HomeStack";
import { RecordsStack } from "./RecordsStack";
import { ReleasesStack } from "./ReleasesStack";
import { ProvidersStack } from "./ProvidersStack";
import { ProfileStack } from "./ProfileStack";
import type { TabsParamList } from "./types";

const Tabs = createBottomTabNavigator<TabsParamList>();

// The root (initial) screen of each tab's nested stack. Tapping a tab resets
// it to this screen — see the `tabPress` listener below.
const TAB_ROOT: Record<keyof TabsParamList, string> = {
  HomeTab: "Dashboard",
  RecordsTab: "RecordsList",
  ReleasesTab: "ReleasesList",
  ProvidersTab: "MyProviders",
  ProfileTab: "Profile",
};

export function TabsNavigator() {
  const t = useTheme();
  return (
    <Tabs.Navigator
      tabBar={(props) => <CenteredTabBar {...props} />}
      // Pressing a tab always shows that tab's main screen, discarding whatever
      // deep screen was left in its stack (e.g. screens opened from the Account
      // Setup checklist). This overrides RN's default of restoring the tab's
      // last nested screen, and works regardless of how the stack was built.
      screenListeners={({ navigation, route }) => ({
        tabPress: (e) => {
          const root = TAB_ROOT[route.name as keyof TabsParamList];
          if (!root) return;
          const state = navigation.getState();
          const index = state.routes.findIndex((r) => r.key === e.target);
          if (index < 0) return;
          const nested = state.routes[index].state;
          // Already showing only this tab's root screen — let the default
          // (a no-op for the focused tab) run so the page doesn't slide in again.
          const atRoot =
            !nested || (nested.routes.length === 1 && nested.routes[0].name === root);
          if (atRoot) return;
          e.preventDefault();
          navigation.dispatch(
            CommonActions.reset({
              ...state,
              index,
              routes: state.routes.map((r, i) =>
                i === index ? { ...r, state: { index: 0, routes: [{ name: root }] } } : r
              ),
            })
          );
        },
      })}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textSecondary,
        // Keep the stacked icon-over-label layout on tablets too; the default
        // switches to a horizontal beside-icon layout on wide screens.
        tabBarLabelPosition: "below-icon",
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
      <Tabs.Screen name="ReleasesTab" component={ReleasesStack} options={{ title: "Releases", popToTopOnBlur: true }} />
      <Tabs.Screen name="ProvidersTab" component={ProvidersStack} options={{ title: "Providers", popToTopOnBlur: true }} />
      <Tabs.Screen name="ProfileTab" component={ProfileStack} options={{ title: "Profile", popToTopOnBlur: true }} />
    </Tabs.Navigator>
  );
}
