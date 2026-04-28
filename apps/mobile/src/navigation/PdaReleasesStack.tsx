import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PdaReleases from "@/screens/pda/releases/PdaReleases";
import PdaReleaseDetail from "@/screens/pda/releases/PdaReleaseDetail";
import PdaWizardStep1 from "@/screens/pda/releases/PdaWizardStep1";
import PdaWizardStep2 from "@/screens/pda/releases/PdaWizardStep2";
import PdaWizardStep3 from "@/screens/pda/releases/PdaWizardStep3";
import PdaWizardStep4 from "@/screens/pda/releases/PdaWizardStep4";
import type { PdaReleasesParamList } from "./types";

const Stack = createNativeStackNavigator<PdaReleasesParamList>();

export function PdaReleasesStack() {
  return (
    <Stack.Navigator
      initialRouteName="PdaReleases"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="PdaReleases" component={PdaReleases} />
      <Stack.Screen name="PdaReleaseDetail" component={PdaReleaseDetail} />
      <Stack.Screen name="PdaWizardStep1" component={PdaWizardStep1} />
      <Stack.Screen name="PdaWizardStep2" component={PdaWizardStep2} />
      <Stack.Screen name="PdaWizardStep3" component={PdaWizardStep3} />
      <Stack.Screen name="PdaWizardStep4" component={PdaWizardStep4} />
    </Stack.Navigator>
  );
}
