import { useState } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as AppleAuthentication from "expo-apple-authentication";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { GoogleLogo } from "@/components/GoogleLogo";
import { DobField } from "@/components/DobField";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useOAuthButtons } from "@/hooks/useOAuthButtons";
import type { AuthParamList } from "@/navigation/types";
import { isAdult, MINIMUM_AGE, toIsoDate } from "@health-agent/types";

type Nav = NativeStackNavigationProp<AuthParamList>;

export default function CreateAccount() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { register } = useAuth();
  const { onApple, onGoogle, error: oauthError, busy: oauthBusy, appleAvailable, googleReady } = useOAuthButtons();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (submitting) return;
    setError(null);
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (pw.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!dob) {
      setError("Date of birth is required");
      return;
    }
    const dobIso = toIsoDate(dob);
    if (!isAdult(dobIso)) {
      setError(`You must be ${MINIMUM_AGE} or older to use Veladon.`);
      return;
    }
    setSubmitting(true);
    const result = await register(email.trim(), pw, dobIso);
    setSubmitting(false);
    if (!result.ok) setError(result.error);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Create Account" onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ gap: 16 }}>
        {appleAvailable ? (
          <View style={{ opacity: oauthBusy ? 0.6 : 1 }} pointerEvents={oauthBusy ? "none" : "auto"}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
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
          <Text style={[styles.providerLabel, { color: t.colors.textPrimary }]}>Create account with Google</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: t.colors.border }]} />
          <Text style={[t.type.caption, { paddingHorizontal: 12 }]}>or continue with email</Text>
          <View style={[styles.dividerLine, { backgroundColor: t.colors.border }]} />
        </View>

        <Input testID="register-email" label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Input testID="register-password" label="Password" placeholder="Min 8 characters" secureTextEntry value={pw} onChangeText={setPw} />
        <Input testID="register-confirm" label="Confirm Password" placeholder="Repeat password" secureTextEntry value={confirm} onChangeText={setConfirm} />
        <DobField testID="register-dob" value={dob} onChange={setDob} />

        {error || oauthError ? (
          <Text style={[t.type.caption, { color: t.colors.destructive }]}>{error || oauthError}</Text>
        ) : null}

        <Button
          testID="register-submit"
          label={submitting ? "Creating account…" : "Create Account"}
          onPress={onSubmit}
          disabled={submitting}
          fullWidth
        />

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
