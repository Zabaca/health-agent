import { useState } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Lock } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import type { AuthParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AuthParamList>;

export default function ResetPassword() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { signIn } = useAuth();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Reset Password" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Button label="Update Password" onPress={signIn} fullWidth />
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        <View style={{ alignItems: "center", gap: 12, marginTop: 16 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: t.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Lock size={32} color={t.colors.primary} />
          </View>
          <Text style={t.type.h2}>Set New Password</Text>
          <Text style={[t.type.caption, { textAlign: "center" }]}>
            Choose a new password for your account.
          </Text>
        </View>

        <Input label="New Password" placeholder="At least 8 characters" secureTextEntry value={pw} onChangeText={setPw} />
        <Input label="Confirm Password" placeholder="Repeat new password" secureTextEntry value={confirm} onChangeText={setConfirm} />
      </Screen>
    </View>
  );
}
