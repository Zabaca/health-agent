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
        <ThemeProvider>
          <AuthProvider>
            <RoleProvider>
              <NavigationContainer linking={linking}>
                {/* PostHogProvider must live INSIDE NavigationContainer: its
                    autocapture calls useNavigation/useNavigationState, which throw
                    when run outside the container. On React Navigation v7 hook-based
                    screen autocapture isn't supported, so we disable captureScreens
                    (capture screen views manually if/when we want them) and keep
                    touch autocapture. Nothing consumes the PostHog context outside
                    the navigator, so this nesting is safe.

                    propsToCapture is restricted to testID: the default also captures
                    string children ($el_text) and accessibilityLabel, which in this
                    app can be PHI (medication names, conditions, providers). Only
                    opaque testIDs may leave the device. */}
                <PostHogProvider
                  apiKey={POSTHOG_KEY}
                  options={{ host: "https://us.i.posthog.com" }}
                  autocapture={{
                    captureScreens: false,
                    captureTouches: true,
                    propsToCapture: ["testID"],
                  }}
                >
                  <RootNavigator />
                  <StatusBar style="dark" />
                </PostHogProvider>
              </NavigationContainer>
            </RoleProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
