import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Eye, EyeOff, Lock } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/theme/ThemeProvider";
import { changePassword, ApiError } from "@/lib/api";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

export default function ChangePassword() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (next.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (next !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(current, next);
      nav.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Change Password" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Button label="Update Password" onPress={onSubmit} fullWidth disabled={saving} />
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
          <Text style={t.type.h2}>Change Password</Text>
        </View>
        {error ? (
          <Text style={{ color: t.colors.destructive, textAlign: "center" }}>{error}</Text>
        ) : null}
        <Input
          label="Current Password"
          secureTextEntry={!showCurrent}
          value={current}
          onChangeText={setCurrent}
          rightElement={
            <Pressable onPress={() => setShowCurrent((v) => !v)} hitSlop={8}>
              {showCurrent ? <EyeOff size={18} color={t.colors.textSecondary} /> : <Eye size={18} color={t.colors.textSecondary} />}
            </Pressable>
          }
        />
        <Input
          label="New Password"
          placeholder="At least 8 characters"
          secureTextEntry={!showNext}
          value={next}
          onChangeText={setNext}
          rightElement={
            <Pressable onPress={() => setShowNext((v) => !v)} hitSlop={8}>
              {showNext ? <EyeOff size={18} color={t.colors.textSecondary} /> : <Eye size={18} color={t.colors.textSecondary} />}
            </Pressable>
          }
        />
        <Input
          label="Confirm New Password"
          placeholder="Repeat new password"
          secureTextEntry={!showConfirm}
          value={confirm}
          onChangeText={setConfirm}
          error={confirm.length > 0 && confirm !== next ? "Passwords don't match" : undefined}
          rightElement={
            <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
              {showConfirm ? <EyeOff size={18} color={t.colors.textSecondary} /> : <Eye size={18} color={t.colors.textSecondary} />}
            </Pressable>
          }
        />
      </Screen>
    </View>
  );
}
