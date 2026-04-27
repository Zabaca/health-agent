import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Profile from "@/screens/profile/Profile";
import AddProvider from "@/screens/profile/AddProvider";
import ConnectAppleHealth from "@/screens/profile/ConnectAppleHealth";
import AccountSettings from "@/screens/profile/AccountSettings";
import EditProfile from "@/screens/profile/EditProfile";
import MyProviders from "@/screens/profile/MyProviders";
import ProviderDetail from "@/screens/profile/ProviderDetail";
import type { ProfileParamList } from "./types";

const Stack = createNativeStackNavigator<ProfileParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator
      initialRouteName="Profile"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="AddProvider" component={AddProvider} />
      <Stack.Screen name="ConnectAppleHealth" component={ConnectAppleHealth} />
      <Stack.Screen name="AccountSettings" component={AccountSettings} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="MyProviders" component={MyProviders} />
      <Stack.Screen name="ProviderDetail" component={ProviderDetail} />
    </Stack.Navigator>
  );
}
