import { View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { AuthStack } from "./AuthStack";
import { TabsNavigator } from "./TabsNavigator";
import { PdaTabsNavigator } from "./PdaTabsNavigator";

export function RootNavigator() {
  const { signedIn, loading } = useAuth();
  const { role } = useRole();
  if (loading) return <View style={{ flex: 1, backgroundColor: "#F5F4F1" }} />;
  if (!signedIn) return <AuthStack />;
  if (role === "pda") return <PdaTabsNavigator />;
  return <TabsNavigator />;
}
