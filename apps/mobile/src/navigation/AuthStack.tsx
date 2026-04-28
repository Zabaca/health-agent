import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SignIn from "@/screens/auth/SignIn";
import CreateAccount from "@/screens/auth/CreateAccount";
import ForgotPassword from "@/screens/auth/ForgotPassword";
import BiometricUnlock from "@/screens/auth/BiometricUnlock";
import ResetPassword from "@/screens/auth/ResetPassword";
import type { AuthParamList } from "./types";

const Stack = createNativeStackNavigator<AuthParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="SignIn"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F5F4F1" } }}
    >
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="CreateAccount" component={CreateAccount} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="BiometricUnlock" component={BiometricUnlock} />
    </Stack.Navigator>
  );
}
