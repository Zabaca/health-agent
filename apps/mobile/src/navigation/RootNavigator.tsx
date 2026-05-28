import { View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { AuthStack } from "./AuthStack";
import { TabsNavigator } from "./TabsNavigator";
import { PdaTabsNavigator } from "./PdaTabsNavigator";
import BiometricUnlock from "@/screens/auth/BiometricUnlock";
import BiometricLock from "@/screens/auth/BiometricLock";
import ConsentScreen from "@/screens/auth/ConsentScreen";

export function RootNavigator() {
  const { signedIn, loading, needsBioSetup, locked, user } = useAuth();
  const { role } = useRole();
  if (loading) return <View style={{ flex: 1, backgroundColor: "#F5F4F1" }} />;
  if (!signedIn) return <AuthStack />;
  // First-run prompt after fresh sign-in (when device supports biometrics).
  if (needsBioSetup) return <BiometricUnlock />;
  // Reveal-gate on cold start / foreground when biometric is enabled.
  if (locked) return <BiometricLock />;
  // Consent gate: blocks until legal acceptance is recorded. PDAs are exempt.
  if (user && !user.isPda && user.consentedAt == null) return <ConsentScreen />;
  if (role === "pda") return <PdaTabsNavigator />;
  return <TabsNavigator />;
}
