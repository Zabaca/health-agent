import { useState } from "react";
import { Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Lock, CheckCircle2 } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/theme/ThemeProvider";
import { resetPassword, ApiError } from "@/lib/api";
import type { AuthParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AuthParamList>;
type R = RouteProp<AuthParamList, "ResetPassword">;

export default function ResetPassword() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const token = params?.token;

  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async () => {
    if (submitting) return;
    setError(null);
    if (!token) {
      setError("This reset link is invalid. Request a new one from Forgot Password.");
      return;
    }
    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(token, pw);
      setDone(true);
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <Header title="Reset Password" variant="none" />
        <Screen
          bottom={
            <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
              <Button label="Back to Sign In" onPress={() => nav.navigate("SignIn")} fullWidth />
            </View>
          }
          contentContainerStyle={{ gap: 16 }}
        >
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
              <CheckCircle2 size={32} color={t.colors.primary} />
            </View>
            <Text style={t.type.h2}>Password Updated</Text>
            <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 16 }]}>
              Your password has been changed. Sign in with your new password.
            </Text>
          </View>
        </Screen>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Reset Password" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Button
              label={submitting ? "Updating…" : "Update Password"}
              onPress={onSubmit}
              disabled={submitting}
              fullWidth
            />
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
        {error ? (
          <Text style={[t.type.caption, { color: t.colors.destructive }]}>{error}</Text>
        ) : null}
      </Screen>
    </View>
  );
}
