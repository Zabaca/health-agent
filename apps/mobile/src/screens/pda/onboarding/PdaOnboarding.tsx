import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { UserRoundCheck } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { AddressAutocompleteInput } from "@/components/AddressAutocompleteInput";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/lib/api";

/**
 * Mandatory first-run screen for designated agents (PDAs). Mirrors the web
 * PdaOnboardingModal: collects the agent's contact phone + mailing address so
 * patients and staff can reach them, then flips `onboarded`. Rendered directly
 * by RootNavigator (not a stack screen) and non-dismissible — there's no back
 * affordance and no tabs until it's completed. On success the re-minted session
 * sets `onboarded` and RootNavigator advances out of the gate automatically.
 */
export default function PdaOnboarding() {
  const t = useTheme();
  const { completeOnboarding } = useAuth();
  const [loading, setLoading] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill anything already on file (e.g. a patient who also became a PDA) so
  // they can confirm rather than retype.
  useEffect(() => {
    getProfile()
      .then((p) => {
        setPhoneNumber(p.phoneNumber ?? "");
        setAddress(p.address ?? "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const canSubmit = phoneNumber.trim().length > 0 && address.trim().length > 0;

  const onSubmit = async () => {
    if (submitting || !canSubmit) return;
    setError(null);
    setSubmitting(true);
    const r = await completeOnboarding(phoneNumber.trim(), address.trim());
    setSubmitting(false);
    if (!r.ok) setError(r.error || "Something went wrong. Please try again.");
    // On success RootNavigator advances out of the gate automatically.
  };

  if (loading) {
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
          <UserRoundCheck size={64} color={t.colors.primary} strokeWidth={2} />
          <Text style={t.type.h2}>Complete your profile</Text>
          <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 24 }]}>
            Before you get started, add a few quick details so patients and staff can reach you.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <Input
            testID="pda-onboard-phone"
            label="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholder="+1 (555) 000-0000"
            required
          />
          <AddressAutocompleteInput
            testID="pda-onboard-address"
            label="Mailing Address"
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St, City, State, ZIP"
            required
          />
        </View>

        {error ? <Text style={[t.type.caption, { color: t.colors.destructive }]}>{error}</Text> : null}

        <View style={{ flex: 1, justifyContent: "flex-end", paddingBottom: 16 }}>
          <Button
            testID="pda-onboard-submit"
            label={submitting ? "Saving…" : "Get Started"}
            onPress={onSubmit}
            disabled={!canSubmit || submitting}
            fullWidth
          />
        </View>
      </Screen>
    </View>
  );
}
