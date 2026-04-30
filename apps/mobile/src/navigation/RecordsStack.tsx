import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RecordsList from "@/screens/records/RecordsList";
import RecordDetailLabs from "@/screens/records/RecordDetailLabs";
import RecordDetailImaging from "@/screens/records/RecordDetailImaging";
import RecordDetailNotes from "@/screens/records/RecordDetailNotes";
import UploadSheet from "@/screens/records/UploadSheet";
import FilterSheet from "@/screens/records/FilterSheet";
import DocumentViewer from "@/screens/records/DocumentViewer";
import CameraCapture from "@/screens/records/CameraCapture";
import UploadPreview from "@/screens/records/UploadPreview";
import type { RecordsParamList } from "./types";

const Stack = createNativeStackNavigator<RecordsParamList>();

export function RecordsStack() {
  return (
    <Stack.Navigator
      initialRouteName="RecordsList"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="RecordsList" component={RecordsList} />
      <Stack.Screen name="RecordDetailLabs" component={RecordDetailLabs} />
      <Stack.Screen name="RecordDetailImaging" component={RecordDetailImaging} />
      <Stack.Screen name="RecordDetailNotes" component={RecordDetailNotes} />
      <Stack.Screen name="UploadSheet" component={UploadSheet} options={{ presentation: "modal" }} />
      <Stack.Screen name="FilterSheet" component={FilterSheet} options={{ presentation: "modal" }} />
      <Stack.Screen name="DocumentViewer" component={DocumentViewer} options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="CameraCapture" component={CameraCapture} options={{ presentation: "fullScreenModal" }} />
      <Stack.Screen name="UploadPreview" component={UploadPreview} options={{ presentation: "fullScreenModal" }} />
    </Stack.Navigator>
  );
}
