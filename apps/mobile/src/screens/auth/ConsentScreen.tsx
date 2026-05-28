import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from "react-native";
import { ShieldCheck, Square, CheckSquare } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { DobField, dateToIso } from "@/components/DobField";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/lib/api";
import { TERMS_URL, PRIVACY_URL, isAdult, MINIMUM_AGE } from "@health-agent/types";

export default function ConsentScreen() {
  const t = useTheme();
  const { recordConsent } = useAuth();
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
      dobIso = dateToIso(dob);
      if (!isAdult(dobIso)) {
        setError(`You must be ${MINIMUM_AGE} or older to use Veladon.`);
        return;
      }
    }
    setSubmitting(true);
    const r = await recordConsent(dobIso);
    setSubmitting(false);
    if (!r.ok) {
      if (r.underage) {
        Alert.alert(
          "Age requirement",
          `Veladon is currently available to adults ${MINIMUM_AGE} and over. We'll add support for younger users in a future release.`,
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
      <Screen contentContainerStyle={{ flexGrow: 1, gap: 20, paddingTop: 64 }}>
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
          <CheckboxRow checked={tos} onToggle={() => setTos((v) => !v)}>
            <Text style={{ fontSize: 15, color: t.colors.textPrimary }}>
              I agree to the{" "}
              <Text style={{ color: t.colors.primary, fontWeight: "600" }} onPress={() => Linking.openURL(TERMS_URL)}>
                Terms of Service
              </Text>
            </Text>
          </CheckboxRow>
          <CheckboxRow checked={privacy} onToggle={() => setPrivacy((v) => !v)}>
            <Text style={{ fontSize: 15, color: t.colors.textPrimary }}>
              I agree to the{" "}
              <Text style={{ color: t.colors.primary, fontWeight: "600" }} onPress={() => Linking.openURL(PRIVACY_URL)}>
                Privacy Policy
              </Text>
            </Text>
          </CheckboxRow>
        </View>

        {error ? <Text style={[t.type.caption, { color: t.colors.destructive }]}>{error}</Text> : null}

        <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 16 }}>
          <Button
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
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onToggle} style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {checked ? (
        <CheckSquare size={24} color={t.colors.primary} />
      ) : (
        <Square size={24} color={t.colors.textSecondary} />
      )}
      <View style={{ flex: 1 }}>{children}</View>
    </Pressable>
  );
}
