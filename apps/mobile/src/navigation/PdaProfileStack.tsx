import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PdaProfile from "@/screens/pda/profile/PdaProfile";
import PdaEditProfile from "@/screens/pda/profile/PdaEditProfile";
import PdaPeopleIRepresent from "@/screens/pda/profile/PdaPeopleIRepresent";
import RoleSwitcher from "@/screens/pda/profile/RoleSwitcher";
import PdaInvite from "@/screens/pda/PdaInvite";
import type { PdaProfileParamList } from "./types";

const Stack = createNativeStackNavigator<PdaProfileParamList>();

export function PdaProfileStack() {
  return (
    <Stack.Navigator
      initialRouteName="PdaProfile"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="PdaProfile" component={PdaProfile} />
      <Stack.Screen name="PdaEditProfile" component={PdaEditProfile} />
      <Stack.Screen name="PdaPeopleIRepresent" component={PdaPeopleIRepresent} />
      <Stack.Screen
        name="RoleSwitcher"
        component={RoleSwitcher}
        options={{ presentation: "transparentModal", animation: "fade" }}
      />
      <Stack.Screen name="PdaInvite" component={PdaInvite} options={{ presentation: "modal" }} />
    </Stack.Navigator>
  );
}
