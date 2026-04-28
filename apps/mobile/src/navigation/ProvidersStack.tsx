import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyProviders from "@/screens/profile/MyProviders";
import AddProvider from "@/screens/profile/AddProvider";
import ProviderDetail from "@/screens/profile/ProviderDetail";
import type { ProvidersParamList } from "./types";

const Stack = createNativeStackNavigator<ProvidersParamList>();

export function ProvidersStack() {
  return (
    <Stack.Navigator
      initialRouteName="MyProviders"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="MyProviders" component={MyProviders} />
      <Stack.Screen name="AddProvider" component={AddProvider} />
      <Stack.Screen name="ProviderDetail" component={ProviderDetail} />
    </Stack.Navigator>
  );
}
