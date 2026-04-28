import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ReleasesList from "@/screens/releases/ReleasesList";
import WizardStep1 from "@/screens/releases/WizardStep1";
import WizardStep2 from "@/screens/releases/WizardStep2";
import WizardStep3 from "@/screens/releases/WizardStep3";
import WizardStep4 from "@/screens/releases/WizardStep4";
import WizardStep5 from "@/screens/releases/WizardStep5";
import ActiveDetail from "@/screens/releases/ActiveDetail";
import PendingDetail from "@/screens/releases/PendingDetail";
import FaxDialog from "@/screens/releases/FaxDialog";
import DateFilterSheet from "@/screens/releases/DateFilterSheet";
import ExportPDF from "@/screens/releases/ExportPDF";
import type { ReleasesParamList } from "./types";

const Stack = createNativeStackNavigator<ReleasesParamList>();

export function ReleasesStack() {
  return (
    <Stack.Navigator
      initialRouteName="ReleasesList"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="ReleasesList" component={ReleasesList} />
      <Stack.Screen name="WizardStep1" component={WizardStep1} />
      <Stack.Screen name="WizardStep2" component={WizardStep2} />
      <Stack.Screen name="WizardStep3" component={WizardStep3} />
      <Stack.Screen name="WizardStep4" component={WizardStep4} />
      <Stack.Screen name="WizardStep5" component={WizardStep5} />
      <Stack.Screen name="ActiveDetail" component={ActiveDetail} />
      <Stack.Screen name="PendingDetail" component={PendingDetail} />
      <Stack.Screen name="FaxDialog" component={FaxDialog} options={{ presentation: "modal" }} />
      <Stack.Screen name="DateFilterSheet" component={DateFilterSheet} options={{ presentation: "modal" }} />
      <Stack.Screen name="ExportPDF" component={ExportPDF} options={{ presentation: "modal" }} />
    </Stack.Navigator>
  );
}
