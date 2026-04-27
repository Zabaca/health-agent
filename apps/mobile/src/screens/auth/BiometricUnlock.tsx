import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ScanFace } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import type { AuthParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AuthParamList>;

export default function BiometricUnlock() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { signIn } = useAuth();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ alignItems: "center", justifyContent: "center", flexGrow: 1, gap: 16 }}>
        <View style={{ alignItems: "center", gap: 12, marginTop: 80 }}>
          <ScanFace size={72} color={t.colors.primary} strokeWidth={2} />
          <Text style={t.type.h2}>Enable Face ID</Text>
          <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 32 }]}>
            Quickly and securely unlock Zabaca with Face ID instead of your password.
          </Text>
        </View>

        <View style={{ width: "100%", alignItems: "center", gap: 16, marginTop: 16 }}>
          <Button label="Enable Face ID" onPress={signIn} fullWidth />
          <Pressable onPress={signIn}>
            <Text style={[t.type.caption, { fontWeight: "500" }]}>Skip</Text>
          </Pressable>
        </View>
      </Screen>
    </View>
  );
}
