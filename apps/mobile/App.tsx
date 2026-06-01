import "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PostHogProvider } from "posthog-react-native";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { AuthProvider } from "@/hooks/useAuth";
import { RoleProvider } from "@/hooks/useRole";
import { RootNavigator } from "@/navigation/RootNavigator";
import { linking } from "@/navigation/linking";

/**
 * Anonymous-first PostHog setup. We never call `identify()`, so events land
 * under PostHog's auto-generated per-install distinct_id with no PII. The
 * `apiKey` is `EXPO_PUBLIC_*` so Metro inlines it into the bundle; an empty
 * key effectively disables capture.
 */
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY ?? "";

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PostHogProvider
          apiKey={POSTHOG_KEY}
          options={{ host: "https://us.i.posthog.com" }}
        >
          <ThemeProvider>
            <AuthProvider>
              <RoleProvider>
                <NavigationContainer linking={linking}>
                  <RootNavigator />
                  <StatusBar style="dark" />
                </NavigationContainer>
              </RoleProvider>
            </AuthProvider>
          </ThemeProvider>
        </PostHogProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
