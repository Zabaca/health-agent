import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Profile from "@/screens/profile/Profile";
import ConnectAppleHealth from "@/screens/profile/ConnectAppleHealth";
import AccountSettings from "@/screens/profile/AccountSettings";
import EditProfile from "@/screens/profile/EditProfile";
import ChangePassword from "@/screens/profile/ChangePassword";
import DesignatedAgents from "@/screens/access/AccessList";
import InviteRepresentative from "@/screens/access/InviteRepresentative";
import RepresentativeDetail from "@/screens/access/RepresentativeDetail";
import ActiveDevices from "@/screens/profile/ActiveDevices";
import type { ProfileParamList } from "./types";

const Stack = createNativeStackNavigator<ProfileParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="ConnectAppleHealth" component={ConnectAppleHealth} />
      <Stack.Screen name="AccountSettings" component={AccountSettings} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} />
      <Stack.Screen name="DesignatedAgents" component={DesignatedAgents} />
      <Stack.Screen name="InviteRepresentative" component={InviteRepresentative} />
      <Stack.Screen name="RepresentativeDetail" component={RepresentativeDetail} />
      <Stack.Screen name="ActiveDevices" component={ActiveDevices} />
    </Stack.Navigator>
  );
}
