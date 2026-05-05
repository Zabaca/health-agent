import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Share, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, Copy, Printer, FileDown, Ban, ArrowLeft } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { getRelease, voidRelease, type ReleaseDetail, type ReleaseProvider } from "@/lib/api";
import type { ReleasesParamList } from "@/navigation/types";

type R = RouteProp<ReleasesParamList, "ActiveDetail">;
type Nav = NativeStackNavigationProp<ReleasesParamList>;

function providerDisplayName(p: ReleaseProvider): string {
  return p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName;
}

function providerSubtitle(p: ReleaseProvider): string {
  const parts: string[] = [p.providerType];
  if (p.physicianName) parts.push(p.physicianName);
  return parts.join(" · ");
}

function recordsList(p: ReleaseProvider): string {
  const checks: string[] = [];
  if (p.providerType === "Insurance") {
    if (p.benefitsCoverage) checks.push("Benefits & Coverage");
    if (p.claimsPayment) checks.push("Claims & Payment");
    if (p.eligibilityEnrollment) checks.push("Eligibility & Enrollment");
    if (p.financialBilling) checks.push("Financial/Billing");
  } else if (p.providerType === "Hospital" || p.providerType === "Facility") {
    if (p.medicalRecords) checks.push("Medical Records");
    if (p.dentalRecords) checks.push("Dental Records");
    if (p.otherNonSpecific) checks.push("Other");
  } else {
    if (p.historyPhysical) checks.push("H&P");
    if (p.diagnosticResults) checks.push("Diagnostics");
    if (p.treatmentProcedure) checks.push("Treatment Notes");
    if (p.prescriptionMedication) checks.push("Rx/Medication");
    if (p.imagingRadiology) checks.push("Imaging");
    if (p.dischargeSummaries) checks.push("Discharge Summary");
    if (p.specificRecords) checks.push("Specific Records");
  }
  return checks.length > 0 ? checks.join(", ") : "—";
}

function daysRemaining(date: string | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ActiveDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<R>();

  const [release, setRelease] = useState<ReleaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRelease(await getRelease(params.releaseId));
    } catch {
      Alert.alert("Error", "Could not load release details.");
    } finally {
      setLoading(false);
    }
  }, [params.releaseId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleRevoke = useCallback(async () => {
    try {
      setRevoking(true);
      await voidRelease(params.releaseId);
      setRevokeOpen(false);
      nav.popToTop();
    } catch {
      setRevokeOpen(false);
      Alert.alert("Error", "Could not revoke release. Please try again.");
    } finally {
      setRevoking(false);
    }
  }, [params.releaseId, nav]);

  const provider = release?.providers[0] ?? null;

  const displayName = provider ? providerDisplayName(provider) : "—";
  const days = release ? daysRemaining(release.authExpirationDate) : null;

  const representativeLabel = release
    ? release.releaseAuthAgent
      ? [release.authAgentFirstName, release.authAgentLastName].filter(Boolean).join(" ") || "Representative"
      : "Self-requested"
    : "—";

  const rows = release && provider ? [
    { label: "Release Code", value: release.releaseCode ?? "—", copy: true, mono: true },
    { label: "Representative", value: representativeLabel },
    { label: "Records included", value: recordsList(provider) },
    { label: "Purpose", value: release.providers[0]?.purpose === "Other" ? `Other — ${release.providers[0]?.purposeOther ?? ""}` : (release.providers[0]?.purpose ?? "—") },
    { label: "Created", value: formatDate(release.createdAt) },
  ] : [];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ height: 56, flexDirection: "row", alignItems: "center", marginTop: insets.top }}>
        <Pressable onPress={() => nav.goBack()} style={{ width: 56, height: 56, paddingLeft: 16, justifyContent: "center" }}>
          <ArrowLeft size={24} color={t.colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={t.type.titleHeader}>Release Detail</Text>
        </View>
        <View style={{ width: 56 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={t.colors.primary} />
        </View>
      ) : !release || !provider ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Text style={[t.type.body, { color: t.colors.destructive }]}>Release not found.</Text>
          <Pressable onPress={() => nav.goBack()}>
            <Text style={[t.type.body, { color: t.colors.primary }]}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <Screen
          bottom={
            <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16, gap: 10 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable
                  onPress={() => nav.navigate("FaxDialog")}
                  style={{ flex: 1, height: 48, borderRadius: t.radius.button, borderWidth: 1, borderColor: t.colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
                >
                  <Printer size={16} color={t.colors.primary} />
                  <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Fax Request</Text>
                </Pressable>
                <Pressable
                  onPress={() => nav.navigate("ExportPDF", { releaseId: params.releaseId })}
                  style={{ flex: 1, height: 48, borderRadius: t.radius.button, borderWidth: 1, borderColor: t.colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
                >
                  <FileDown size={16} color={t.colors.primary} />
                  <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Save PDF</Text>
                </Pressable>
              </View>
              <Pressable
                onPress={() => setRevokeOpen(true)}
                style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.destructive, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
              >
                <Ban size={16} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>Revoke Release</Text>
              </Pressable>
            </View>
          }
          contentContainerStyle={{ gap: 12 }}
        >
          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[t.type.h2, { flex: 1, marginRight: 8 }]} numberOfLines={2}>{displayName}</Text>
              <Badge label="Active" variant="success" />
            </View>
            <Text style={t.type.caption}>{providerSubtitle(provider)}</Text>
            {release.authExpirationDate && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Calendar size={14} color={t.colors.primary} />
                <Text style={[t.type.caption, { color: t.colors.primary }]}>
                  Valid until {formatDate(release.authExpirationDate)}{days !== null ? ` · ${days} day${days === 1 ? "" : "s"} remaining` : ""}
                </Text>
              </View>
            )}
          </View>

          <View
            style={{
              backgroundColor: t.colors.surface,
              borderRadius: t.radius.card,
              borderWidth: 1,
              borderColor: t.colors.border,
              overflow: "hidden",
            }}
          >
            {rows.map((row, i) => (
              <Pressable
                key={row.label}
                onPress={row.copy ? () => Share.share({ message: row.value }) : undefined}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: t.colors.divider,
                  gap: 3,
                }}
              >
                <Text style={t.type.caption}>{row.label}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Text style={[t.type.body, { fontWeight: "600", flex: 1, fontFamily: row.mono ? "Courier" : undefined }]}>{row.value}</Text>
                  {row.copy ? <Copy size={14} color={t.colors.textSecondary} /> : null}
                </View>
              </Pressable>
            ))}
          </View>
        </Screen>
      )}

      <ConfirmDrawer
        visible={revokeOpen}
        title="Revoke this release?"
        message={`${displayName} will no longer be authorized to share records under code ${release?.releaseCode ?? ""}. You can create a new release any time.`}
        confirmLabel={revoking ? "Revoking…" : "Revoke Release"}
        onCancel={() => setRevokeOpen(false)}
        onConfirm={handleRevoke}
      />
    </View>
  );
}
