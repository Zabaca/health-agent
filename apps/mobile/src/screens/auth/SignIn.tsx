import { useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Sprout } from "lucide-react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { GoogleLogo } from "@/components/GoogleLogo";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useOAuthButtons } from "@/hooks/useOAuthButtons";
import type { AuthParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AuthParamList>;

export default function SignIn() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { signInEmail } = useAuth();
  const { onApple, onGoogle, error: oauthError, busy: oauthBusy, appleAvailable, googleReady } = useOAuthButtons();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (submitting) return;
    setError(null);
    if (!email.trim() || !password) {
      setError("Email and password are required");
      return;
    }
    setSubmitting(true);
    const result = await signInEmail(email.trim(), password);
    setSubmitting(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <Screen testID="signin-screen" safeTop contentContainerStyle={{ paddingTop: 60, gap: 16, alignItems: "stretch" }}>
      <View style={{ alignItems: "center", gap: 12, marginBottom: 8 }}>
        <View style={[styles.logoTile, { backgroundColor: t.colors.primary }]}>
          <Sprout size={28} color="#FFFFFF" />
        </View>
        <Text style={t.type.h2}>Veladon</Text>
        <Text style={t.type.caption}>Your health, in your hands.</Text>
      </View>

      {appleAvailable ? (
        <View style={{ opacity: oauthBusy ? 0.6 : 1 }} pointerEvents={oauthBusy ? "none" : "auto"}>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={14}
            style={styles.appleBtn}
            onPress={onApple}
          />
        </View>
      ) : null}
      <Pressable
        style={[
          styles.providerBtn,
          {
            backgroundColor: t.colors.surface,
            borderWidth: 1,
            borderColor: t.colors.border,
            opacity: !googleReady || oauthBusy ? 0.6 : 1,
          },
        ]}
        onPress={onGoogle}
        disabled={!googleReady || oauthBusy}
      >
        <GoogleLogo size={18} />
        <Text style={[styles.providerLabel, { color: t.colors.textPrimary }]}>Sign in with Google</Text>
      </Pressable>

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: t.colors.border }]} />
        <Text style={[t.type.caption, { paddingHorizontal: 12 }]}>or continue with email</Text>
        <View style={[styles.dividerLine, { backgroundColor: t.colors.border }]} />
      </View>

      <Input testID="signin-email" placeholder="Email address" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <View style={{ position: "relative" }}>
        <Input testID="signin-password" placeholder="Password" secureTextEntry={!showPw} autoCapitalize="none" autoCorrect={false} value={password} onChangeText={setPassword} />
        <Pressable
          onPress={() => setShowPw((v) => !v)}
          style={{ position: "absolute", right: 14, top: 14 }}
        >
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>{showPw ? "Hide" : "Show"}</Text>
        </Pressable>
      </View>

      {error || oauthError ? (
        <Text style={[t.type.caption, { color: t.colors.destructive }]}>{error || oauthError}</Text>
      ) : null}

      <Button testID="signin-submit" label={submitting ? "Signing in…" : "Sign In"} onPress={onSubmit} disabled={submitting} fullWidth />

      <View style={{ alignItems: "center", gap: 12, paddingTop: 4 }}>
        <Pressable onPress={() => nav.navigate("ForgotPassword")}>
          <Text style={t.type.caption}>Forgot password?</Text>
        </Pressable>
        <View style={{ flexDirection: "row" }}>
          <Text style={t.type.caption}>Don't have an account? </Text>
          <Pressable testID="signin-create-account" onPress={() => nav.navigate("CreateAccount")}>
            <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Create Account</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logoTile: { width: 64, height: 64, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  appleBtn: { height: 52, width: "100%" },
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
