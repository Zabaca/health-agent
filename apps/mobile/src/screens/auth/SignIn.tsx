import { useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Apple, Sprout } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import type { AuthParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AuthParamList>;

export default function SignIn() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  return (
    <Screen safeTop contentContainerStyle={{ paddingTop: 60, gap: 16, alignItems: "stretch" }}>
      <View style={{ alignItems: "center", gap: 12, marginBottom: 8 }}>
        <View style={[styles.logoTile, { backgroundColor: t.colors.primary }]}>
          <Sprout size={28} color="#FFFFFF" />
        </View>
        <Text style={t.type.h2}>Zabaca</Text>
        <Text style={t.type.caption}>Your health, in your hands.</Text>
      </View>

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

      <Input placeholder="Email address" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <View style={{ position: "relative" }}>
        <Input placeholder="Password" secureTextEntry={!showPw} value={password} onChangeText={setPassword} />
        <Pressable
          onPress={() => setShowPw((v) => !v)}
          style={{ position: "absolute", right: 14, top: 14 }}
        >
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>{showPw ? "Hide" : "Show"}</Text>
        </Pressable>
      </View>

      <Button label="Sign In" onPress={signIn} fullWidth />

      <View style={{ alignItems: "center", gap: 12, paddingTop: 4 }}>
        <Pressable onPress={() => nav.navigate("BiometricUnlock")}>
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Use Face ID instead</Text>
        </Pressable>
        <Pressable onPress={() => nav.navigate("ForgotPassword")}>
          <Text style={t.type.caption}>Forgot password?</Text>
        </Pressable>
        <View style={{ flexDirection: "row" }}>
          <Text style={t.type.caption}>Don't have an account? </Text>
          <Pressable onPress={() => nav.navigate("CreateAccount")}>
            <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Create Account</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoTile: { width: 64, height: 64, borderRadius: 14, alignItems: "center", justifyContent: "center" },
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
