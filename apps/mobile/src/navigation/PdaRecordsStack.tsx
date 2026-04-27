import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PdaRecords from "@/screens/pda/records/PdaRecords";
import PdaRecordDetail from "@/screens/pda/records/PdaRecordDetail";
import type { PdaRecordsParamList } from "./types";

const Stack = createNativeStackNavigator<PdaRecordsParamList>();

export function PdaRecordsStack() {
  return (
    <Stack.Navigator
      initialRouteName="PdaRecords"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="PdaRecords" component={PdaRecords} />
      <Stack.Screen name="PdaRecordDetail" component={PdaRecordDetail} />
    </Stack.Navigator>
  );
}
