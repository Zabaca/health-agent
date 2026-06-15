import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PdaHome from "@/screens/pda/home/PdaHome";
import RoleSwitcher from "@/screens/pda/profile/RoleSwitcher";
import PdaInvite from "@/screens/pda/PdaInvite";
import type { PdaHomeParamList } from "./types";

const Stack = createNativeStackNavigator<PdaHomeParamList>();

export function PdaHomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="PdaHome"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="PdaHome" component={PdaHome} />
      <Stack.Screen
        name="RoleSwitcher"
        component={RoleSwitcher}
        options={{ presentation: "transparentModal", animation: "fade" }}
      />
      <Stack.Screen name="PdaInvite" component={PdaInvite} options={{ presentation: "modal" }} />
    </Stack.Navigator>
  );
}
