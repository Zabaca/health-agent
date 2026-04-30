import { View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { AuthStack } from "./AuthStack";
import { TabsNavigator } from "./TabsNavigator";
import { PdaTabsNavigator } from "./PdaTabsNavigator";
import BiometricUnlock from "@/screens/auth/BiometricUnlock";
import BiometricLock from "@/screens/auth/BiometricLock";

export function RootNavigator() {
  const { signedIn, loading, needsBioSetup, locked } = useAuth();
  const { role } = useRole();
  if (loading) return <View style={{ flex: 1, backgroundColor: "#F5F4F1" }} />;
  if (!signedIn) return <AuthStack />;
  // First-run prompt after fresh sign-in (when device supports biometrics).
  if (needsBioSetup) return <BiometricUnlock />;
  // Reveal-gate on cold start / foreground when biometric is enabled.
  if (locked) return <BiometricLock />;
  if (role === "pda") return <PdaTabsNavigator />;
  return <TabsNavigator />;
}
