import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PdaReleases from "@/screens/pda/releases/PdaReleases";
import PdaReleaseDetail from "@/screens/pda/releases/PdaReleaseDetail";
import PdaWizardStep1 from "@/screens/pda/releases/PdaWizardStep1";
import PdaWizardStep2 from "@/screens/pda/releases/PdaWizardStep2";
import PdaWizardStep3 from "@/screens/pda/releases/PdaWizardStep3";
import PdaWizardStep4 from "@/screens/pda/releases/PdaWizardStep4";
// PDF export + fax dialog are shared with the patient releases stack; the PDF
// screen switches to the PDA-scoped print endpoint when given a patientId.
import ExportPDF from "@/screens/releases/ExportPDF";
import FaxDialog from "@/screens/releases/FaxDialog";
import { PdaWizardProvider } from "@/screens/pda/releases/_PdaWizardContext";
import type { PdaReleasesParamList } from "./types";

const Stack = createNativeStackNavigator<PdaReleasesParamList>();

export function PdaReleasesStack() {
  return (
    <PdaWizardProvider>
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
        <Stack.Screen name="ExportPDF" component={ExportPDF} options={{ presentation: "modal" }} />
        <Stack.Screen name="FaxDialog" component={FaxDialog} options={{ presentation: "modal" }} />
      </Stack.Navigator>
    </PdaWizardProvider>
  );
}
