import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { ShieldCheck, Square, CheckSquare } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { DobField } from "@/components/DobField";
import { openLegalDoc } from "@/lib/legal";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/lib/api";
import { MINIMUM_AGE, toIsoDate } from "@health-agent/types";

export default function ConsentScreen() {
  const t = useTheme();
  const { recordConsent, signOut } = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [hasDob, setHasDob] = useState(false);
  const [dob, setDob] = useState<Date | null>(null);
  const [tos, setTos] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => setHasDob(p.dateOfBirth !== ""))
      .catch(() => setHasDob(false))
      .finally(() => setLoadingProfile(false));
  }, []);

  const canSubmit = tos && privacy && (hasDob || dob !== null);

  const onAccept = async () => {
    if (submitting) return;
    setError(null);
    let dobIso: string | undefined;
    if (!hasDob) {
      if (!dob) {
        setError("Date of birth is required");
        return;
      }
      // Don't block under-18 here: the row already exists (OAuth created it at
      // sign-in), so the DOB must reach the server, which purges the account and
      // returns 403 → handled below.
      dobIso = toIsoDate(dob);
    }
    setSubmitting(true);
    const r = await recordConsent(dobIso);
    setSubmitting(false);
    if (!r.ok) {
      if (r.underage) {
        // Account was hard-deleted server-side; sign out (clearing the now-dead
        // token + local state) only after the user acknowledges why.
        Alert.alert(
          "Age requirement",
          `Veladon is currently available to adults ${MINIMUM_AGE} and over. We'll add support for younger users in a future release.`,
          [{ text: "OK", onPress: () => { void signOut(); } }],
        );
      } else {
        setError(r.error ?? "Something went wrong. Please try again.");
      }
    }
    // On success the re-minted session sets consentedAt and RootNavigator
    // advances out of the gate automatically.
  };

  if (loadingProfile) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Screen testID="consent-screen" contentContainerStyle={{ flexGrow: 1, gap: 20, paddingTop: 64 }}>
        <View style={{ alignItems: "center", gap: 12 }}>
          <ShieldCheck size={64} color={t.colors.primary} strokeWidth={2} />
          <Text style={t.type.h2}>Before you continue</Text>
          <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 24 }]}>
            Veladon is available to adults {MINIMUM_AGE} and over. Please review and accept our terms
            to continue.
          </Text>
        </View>

        {!hasDob ? <DobField value={dob} onChange={setDob} /> : null}

        <View style={{ gap: 16 }}>
          <CheckboxRow testID="consent-tos" checked={tos} onToggle={() => setTos((v) => !v)}>
            <Text style={{ fontSize: 15, color: t.colors.textPrimary }}>
              I agree to the{" "}
              <Text style={{ color: t.colors.primary, fontWeight: "600" }} onPress={() => openLegalDoc("terms")}>
                Terms of Service
              </Text>
            </Text>
          </CheckboxRow>
          <CheckboxRow testID="consent-privacy" checked={privacy} onToggle={() => setPrivacy((v) => !v)}>
            <Text style={{ fontSize: 15, color: t.colors.textPrimary }}>
              I agree to the{" "}
              <Text style={{ color: t.colors.primary, fontWeight: "600" }} onPress={() => openLegalDoc("privacy")}>
                Privacy Policy
              </Text>
            </Text>
          </CheckboxRow>
        </View>

        {error ? <Text style={[t.type.caption, { color: t.colors.destructive }]}>{error}</Text> : null}

        <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 16 }}>
          <Button
            testID="consent-continue"
            label={submitting ? "Saving…" : "Continue"}
            onPress={onAccept}
            disabled={!canSubmit || submitting}
            fullWidth
          />
        </View>
      </Screen>
    </View>
  );
}

function CheckboxRow({
  checked,
  onToggle,
  children,
  testID,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  testID?: string;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onToggle} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {/* testID is on the checkbox itself (not the row) so taps land on the box,
          never on the embedded "Terms of Service"/"Privacy Policy" links that
          sit inside `children` and open the hosted legal docs in a browser sheet. */}
      <Pressable testID={testID} onPress={onToggle} hitSlop={10}>
        {checked ? (
          <CheckSquare size={24} color={t.colors.primary} />
        ) : (
          <Square size={24} color={t.colors.textSecondary} />
        )}
      </Pressable>
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}
