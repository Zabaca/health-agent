import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PdaRecords from "@/screens/pda/records/PdaRecords";
import PdaRecordDetail from "@/screens/pda/records/PdaRecordDetail";
import PdaFilterSheet from "@/screens/pda/records/PdaFilterSheet";
import PdaUploadSheet from "@/screens/pda/records/PdaUploadSheet";
import PdaCameraCapture from "@/screens/pda/records/PdaCameraCapture";
import PdaUploadPreview from "@/screens/pda/records/PdaUploadPreview";
import type { PdaRecordsParamList } from "./types";

const Stack = createNativeStackNavigator<PdaRecordsParamList>();

export function PdaRecordsStack() {
  return (
    <Stack.Navigator
      initialRouteName="PdaRecords"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="PdaRecords" component={PdaRecords} />
      <Stack.Screen name="PdaRecordDetail" component={PdaRecordDetail} options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="PdaFilterSheet" component={PdaFilterSheet} options={{ presentation: "modal" }} />
      <Stack.Screen name="PdaUploadSheet" component={PdaUploadSheet} options={{ presentation: "modal" }} />
      <Stack.Screen name="PdaCameraCapture" component={PdaCameraCapture} options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="PdaUploadPreview" component={PdaUploadPreview} options={{ presentation: "fullScreenModal" }} />
    </Stack.Navigator>
  );
}
