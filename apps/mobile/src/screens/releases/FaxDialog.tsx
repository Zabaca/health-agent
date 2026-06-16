import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system";
import { Building2, Phone, Printer, AlertTriangle } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/theme/ThemeProvider";
import { API_URL, getSessionToken, faxRelease, faxRepresentingRelease, ApiError } from "@/lib/api";

// Shared by the patient and PDA release stacks. Faxes the SAME PDF that Save PDF
// produces: it renders the release print-html (patient- or PDA-scoped) to a PDF
// via expo-print, then posts it through the scoped fax route — faxRelease for an
// owned release, faxRepresentingRelease for a PDA-agent one. Stack-agnostic nav.
type Route = RouteProp<
  { FaxDialog: { releaseId: string; patientId?: string; recipientName?: string; defaultFax?: string } },
  "FaxDialog"
>;

export default function FaxDialog() {
  const t = useTheme();
  const nav = useNavigation();
  const { params } = useRoute<Route>();
  const { releaseId, patientId, recipientName, defaultFax } = params;

  const [fax, setFax] = useState(defaultFax ?? "");
  const [sending, setSending] = useState(false);

  const recipient = recipientName ?? "Medical Records";

  async function handleSend() {
    const faxNumber = fax.trim();
    if (!faxNumber) {
      Alert.alert("Fax number required", "Enter the recipient's fax number.");
      return;
    }
    setSending(true);
    try {
      // Render the canonical release document to a PDF (same source as Save PDF).
      const token = await getSessionToken();
      const path = patientId
        ? `/api/representing/${patientId}/releases/${releaseId}/print-html`
        : `/api/releases/${releaseId}/print-html`;
      const res = await fetch(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/html" },
      });
      if (!res.ok) throw new Error(`Failed to load release (${res.status})`);
      const html = await res.text();

      const { uri } = await Print.printToFileAsync({ html });
      let fileData: string;
      try {
        fileData = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } finally {
        // expo-print writes the PDF to the cache dir; it's only needed long enough
        // to base64-encode (the send uses fileData, not the file), so drop it.
        FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
      }

      const faxInput = { faxNumber, fileData, fileName: `release-${releaseId}.pdf`, recipientName: recipient };
      if (patientId) {
        await faxRepresentingRelease(patientId, releaseId, faxInput);
      } else {
        await faxRelease(releaseId, faxInput);
      }

      Alert.alert(
        "Fax queued",
        "Your fax has been queued. Check back on the release detail page in a few minutes to see its status.",
        [{ text: "OK", onPress: () => nav.goBack() }],
      );
    } catch (e) {
      const rateLimited = e instanceof ApiError && e.status === 429;
      Alert.alert(
        rateLimited ? "Recently faxed" : "Fax failed",
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header variant="close" title="Fax Request" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16, gap: 10 }}>
            <Pressable
              onPress={handleSend}
              disabled={sending}
              style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, opacity: sending ? 0.7 : 1 }}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Printer size={16} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Send Fax</Text>
                </>
              )}
            </Pressable>
            <Button label="Cancel" variant="secondary" onPress={() => nav.goBack()} fullWidth disabled={sending} />
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.border,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.colors.primaryBg, alignItems: "center", justifyContent: "center" }}>
            <Building2 size={20} color={t.colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={t.type.bodyStrong}>{recipient}</Text>
            <Text style={t.type.caption}>Dept. of Health Records</Text>
            {fax ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                <Phone size={12} color={t.colors.primary} />
                <Text style={{ color: t.colors.primary, fontWeight: "600" }}>{fax}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <Input label="FAX NUMBER" value={fax} onChangeText={setFax} keyboardType="phone-pad" placeholder="(555) 000-0000" />

        <View
          style={{
            backgroundColor: "#FFF4EE",
            borderRadius: t.radius.card,
            padding: 14,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <AlertTriangle size={16} color={t.colors.accent} />
          <Text style={[t.type.caption, { color: t.colors.accent, flex: 1 }]}>
            The signed authorization PDF will be faxed. You will not receive a read confirmation — contact the provider to confirm receipt.
          </Text>
        </View>
      </Screen>
    </View>
  );
}
