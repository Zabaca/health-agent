import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { AuthStack } from "./AuthStack";
import { TabsNavigator } from "./TabsNavigator";
import { PdaTabsNavigator } from "./PdaTabsNavigator";

export function RootNavigator() {
  const { signedIn } = useAuth();
  const { role } = useRole();
  if (!signedIn) return <AuthStack />;
  if (role === "pda") return <PdaTabsNavigator />;
  return <TabsNavigator />;
}
