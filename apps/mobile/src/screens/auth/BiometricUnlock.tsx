import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScanFace } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";

/**
 * First-run setup screen. Shown after a fresh sign-in (when there's no
 * stored biometric pref yet) by RootNavigator — not via a Stack route.
 *
 * Either choice persists `bio_enabled` in SecureStore, which flips
 * `needsBioSetup` to false and lets RootNavigator advance to the regular
 * tab navigator.
 */
export default function BiometricUnlock() {
  const t = useTheme();
  const { enableBiometric, skipBiometricSetup } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onEnable = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await enableBiometric();
    setBusy(false);
    // On cancel just stay; on other failure surface the message.
    if (!r.ok && r.error !== "Cancelled") setError(r.error);
  };

  const onSkip = async () => {
    if (busy) return;
    await skipBiometricSetup();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Screen contentContainerStyle={{ alignItems: "center", justifyContent: "center", flexGrow: 1, gap: 16 }}>
        <View style={{ alignItems: "center", gap: 12, marginTop: 80 }}>
          <ScanFace size={72} color={t.colors.primary} strokeWidth={2} />
          <Text style={t.type.h2}>Enable Face ID</Text>
          <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 32 }]}>
            Quickly and securely unlock HealthAgent with Face ID instead of your password.
          </Text>
        </View>

        {error ? (
          <Text style={[t.type.caption, { color: t.colors.destructive }]}>{error}</Text>
        ) : null}

        <View style={{ width: "100%", alignItems: "center", gap: 16, marginTop: 16 }}>
          <Button
            label={busy ? "Authenticating…" : "Enable Face ID"}
            onPress={onEnable}
            disabled={busy}
            fullWidth
          />
          <Pressable onPress={onSkip} disabled={busy}>
            <Text style={[t.type.caption, { fontWeight: "500" }]}>Skip</Text>
          </Pressable>
        </View>
      </Screen>
    </View>
  );
}
