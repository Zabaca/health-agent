import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Dashboard from "@/screens/home/Dashboard";
import CardExpanded from "@/screens/home/CardExpanded";
import SleepExpanded from "@/screens/home/SleepExpanded";
import GlucoseExpanded from "@/screens/home/GlucoseExpanded";
import StepsExpanded from "@/screens/home/StepsExpanded";
import Notifications from "@/screens/home/Notifications";
import AccountSetup from "@/screens/home/AccountSetup";
import type { HomeParamList } from "./types";

const Stack = createNativeStackNavigator<HomeParamList>();

export function HomeStack() {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="Dashboard" component={Dashboard} />
      <Stack.Screen name="CardExpanded" component={CardExpanded} />
      <Stack.Screen name="SleepExpanded" component={SleepExpanded} />
      <Stack.Screen name="GlucoseExpanded" component={GlucoseExpanded} />
      <Stack.Screen name="StepsExpanded" component={StepsExpanded} />
      <Stack.Screen name="Notifications" component={Notifications} />
      <Stack.Screen name="AccountSetup" component={AccountSetup} />
    </Stack.Navigator>
  );
}
