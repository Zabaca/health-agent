import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PdaProviders from "@/screens/pda/providers/PdaProviders";
import PdaAddProvider from "@/screens/pda/providers/PdaAddProvider";
import PdaProviderDetail from "@/screens/pda/providers/PdaProviderDetail";
import type { PdaProvidersParamList } from "./types";

const Stack = createNativeStackNavigator<PdaProvidersParamList>();

export function PdaProvidersStack() {
  return (
    <Stack.Navigator
      initialRouteName="PdaProviders"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="PdaProviders" component={PdaProviders} />
      <Stack.Screen name="PdaAddProvider" component={PdaAddProvider} />
      <Stack.Screen name="PdaProviderDetail" component={PdaProviderDetail} />
    </Stack.Navigator>
  );
}
