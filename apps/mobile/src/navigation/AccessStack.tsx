import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AccessList from "@/screens/access/AccessList";
import InviteRepresentative from "@/screens/access/InviteRepresentative";
import RepresentativeDetail from "@/screens/access/RepresentativeDetail";
import type { AccessParamList } from "./types";

const Stack = createNativeStackNavigator<AccessParamList>();

export function AccessStack() {
  return (
    <Stack.Navigator
      initialRouteName="AccessList"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="AccessList" component={AccessList} />
      <Stack.Screen name="InviteRepresentative" component={InviteRepresentative} />
      <Stack.Screen name="RepresentativeDetail" component={RepresentativeDetail} />
    </Stack.Navigator>
  );
}
