import { useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Apple } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import type { AuthParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AuthParamList>;

export default function CreateAccount() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Create Account" onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ gap: 16 }}>
        <Pressable style={[styles.providerBtn, { backgroundColor: "#000000" }]}>
          <Apple size={18} color="#FFFFFF" />
          <Text style={[styles.providerLabel, { color: "#FFFFFF" }]}>Sign in with Apple</Text>
        </Pressable>
        <Pressable
          style={[
            styles.providerBtn,
            { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
          ]}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#DB4437" }}>G</Text>
          <Text style={[styles.providerLabel, { color: t.colors.textPrimary }]}>Sign in with Google</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: t.colors.border }]} />
          <Text style={[t.type.caption, { paddingHorizontal: 12 }]}>or continue with email</Text>
          <View style={[styles.dividerLine, { backgroundColor: t.colors.border }]} />
        </View>

        <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input label="Password" placeholder="Min 8 characters" secureTextEntry value={pw} onChangeText={setPw} />
        <Input label="Confirm Password" placeholder="Repeat password" secureTextEntry value={confirm} onChangeText={setConfirm} />

        <Button label="Create Account" onPress={signIn} fullWidth />

        <View style={{ flexDirection: "row", justifyContent: "center" }}>
          <Pressable onPress={() => nav.goBack()}>
            <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Already have an account? Sign in</Text>
          </Pressable>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  providerBtn: {
    height: 52,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  providerLabel: { fontSize: 16, fontWeight: "600" },
  dividerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
});
