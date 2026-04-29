import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ScanFace } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";

/**
 * Reveal-gate shown when the user has biometric enabled and the app needs
 * to verify the device holder. Auto-prompts once on mount; the user can
 * re-tap "Use Face ID" to retry, or fall back to "Use password instead"
 * which fully signs them out and routes them to SignIn.
 */
export default function BiometricLock() {
  const t = useTheme();
  const { unlock, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const promptedOnce = useRef(false);

  const tryUnlock = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const r = await unlock();
    setBusy(false);
    if (!r.ok) setError(r.error === "Cancelled" ? null : r.error);
  };

  // Fire the system prompt once automatically on mount. If the user
  // dismisses it, they can retry via the button.
  useEffect(() => {
    if (promptedOnce.current) return;
    promptedOnce.current = true;
    tryUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Screen contentContainerStyle={{ alignItems: "center", justifyContent: "center", flexGrow: 1, gap: 16 }}>
        <View style={{ alignItems: "center", gap: 12, marginTop: 80 }}>
          <ScanFace size={72} color={t.colors.primary} strokeWidth={2} />
          <Text style={t.type.h2}>Unlock HealthAgent</Text>
          <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 32 }]}>
            Use Face ID or your device passcode to continue.
          </Text>
        </View>

        {error ? (
          <Text style={[t.type.caption, { color: t.colors.destructive }]}>{error}</Text>
        ) : null}

        <View style={{ width: "100%", alignItems: "center", gap: 16, marginTop: 16 }}>
          <Button label={busy ? "Authenticating…" : "Use Face ID"} onPress={tryUnlock} disabled={busy} fullWidth />
          <Pressable onPress={() => signOut()}>
            <Text style={[t.type.caption, { fontWeight: "500", color: t.colors.primary }]}>
              Use password instead
            </Text>
          </Pressable>
        </View>
      </Screen>
    </View>
  );
}
