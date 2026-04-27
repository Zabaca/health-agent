import { useState } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Key } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/theme/ThemeProvider";
import type { AuthParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AuthParamList>;

export default function ForgotPassword() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [email, setEmail] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Forgot Password" onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ gap: 16 }}>
        <View style={{ alignItems: "center", gap: 12, marginTop: 24 }}>
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
            <Key size={32} color={t.colors.primary} />
          </View>
          <Text style={t.type.h2}>Forgot your password?</Text>
          <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 16 }]}>
            Enter your email and we'll send you a link to reset your password.
          </Text>
        </View>

        <Input label="Email address" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Button label="Send Reset Link" onPress={() => nav.navigate("ResetPassword")} fullWidth />

        <View
          style={{
            backgroundColor: t.colors.primaryBg,
            borderRadius: t.radius.card,
            padding: 16,
            gap: 6,
          }}
        >
          <Text style={[t.type.bodyStrong, { color: t.colors.primary }]}>Check your email</Text>
          <Text style={[t.type.caption, { color: t.colors.primary }]}>
            If an account exists for that email, you'll receive a reset link within a few minutes.
          </Text>
        </View>
      </Screen>
    </View>
  );
}
