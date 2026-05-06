import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, useFocusEffect, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Calendar, Hourglass, Ban } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import { getRepresentingRelease, voidRepresentingRelease, type ReleaseDetail, type ReleaseProvider } from "@/lib/api";
import type { PdaReleasesParamList } from "@/navigation/types";

type R = RouteProp<PdaReleasesParamList, "PdaReleaseDetail">;
type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

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

export default function PdaReleaseDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<R>();
  const { currentPatient } = useRepresentedPatients();
  const isEditor = currentPatient?.releasePermission === "editor";

  const [release, setRelease] = useState<ReleaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    if (!currentPatient) return;
    try {
      setLoading(true);
      setRelease(await getRepresentingRelease(currentPatient.patientId, params.releaseId));
    } catch {
      Alert.alert("Error", "Could not load release details.");
    } finally {
      setLoading(false);
    }
  }, [currentPatient, params.releaseId]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleRevoke = useCallback(async () => {
    if (!currentPatient) return;
    try {
      setRevoking(true);
      await voidRepresentingRelease(currentPatient.patientId, params.releaseId);
      setRevokeOpen(false);
      nav.popToTop();
    } catch {
      setRevokeOpen(false);
      Alert.alert("Error", "Could not revoke release. Please try again.");
    } finally {
      setRevoking(false);
    }
  }, [currentPatient, params.releaseId, nav]);

  const provider = release?.providers[0] ?? null;
  const isPending = release ? !release.authSignatureImage && !release.voided : false;
  const isVoided = release?.voided ?? false;

  const displayName = provider ? providerDisplayName(provider) : "—";
  const days = release ? daysRemaining(release.authExpirationDate) : null;

  const agentName = release
    ? [release.authAgentFirstName, release.authAgentLastName].filter(Boolean).join(" ") || "You"
    : "—";

  const rows = release && provider ? [
    { label: "Release Code", value: release.releaseCode ?? "—", mono: true },
    { label: "Representative", value: agentName, tint: true },
    { label: "Records included", value: recordsList(provider) },
    { label: "Created", value: formatDate(release.createdAt) },
  ] : [];

  const patientName = currentPatient
    ? `${currentPatient.firstName ?? ""} ${currentPatient.lastName ?? ""}`.trim() || "the patient"
    : "the patient";

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
            isEditor && !isVoided ? (
              <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
                <Pressable
                  onPress={() => setRevokeOpen(true)}
                  style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.destructive, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
                >
                  <Ban size={16} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                    {isPending ? "Cancel Release" : "Revoke Release"}
                  </Text>
                </Pressable>
              </View>
            ) : undefined
          }
          contentContainerStyle={{ gap: 12 }}
        >
          {isPending && (
            <View
              style={{
                backgroundColor: "#FFF6E5",
                borderRadius: t.radius.card,
                padding: 14,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Hourglass size={18} color={t.colors.accent} style={{ flexShrink: 0 }} />
              <Text style={[t.type.caption, { color: t.colors.accent, flex: 1 }]}>
                Awaiting patient signature. {patientName} must review and sign before this release becomes active.
              </Text>
            </View>
          )}

          <View style={{ gap: 6 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={[t.type.h2, { flex: 1, marginRight: 8 }]} numberOfLines={2}>{displayName}</Text>
              <Badge
                label={isVoided ? "Voided" : isPending ? "Pending Signature" : "Active"}
                variant={isVoided ? "accent" : isPending ? "accent" : "success"}
              />
            </View>
            <Text style={t.type.caption}>{providerSubtitle(provider)}</Text>
            {release.authExpirationDate && !isVoided && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                <Calendar size={14} color={t.colors.primary} />
                <Text style={[t.type.caption, { color: t.colors.primary }]}>
                  Valid until {formatDate(release.authExpirationDate)}
                  {days !== null ? ` · ${days} day${days === 1 ? "" : "s"} remaining` : ""}
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
              <View
                key={row.label}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: t.colors.divider,
                  gap: 3,
                }}
              >
                <Text style={t.type.caption}>{row.label}</Text>
                <Text
                  style={[
                    t.type.body,
                    {
                      fontWeight: "600",
                      color: row.tint ? t.colors.primary : t.colors.textPrimary,
                      fontFamily: row.mono ? "Courier" : undefined,
                    },
                  ]}
                >
                  {row.value}
                </Text>
              </View>
            ))}
          </View>
        </Screen>
      )}

      <ConfirmDrawer
        visible={revokeOpen}
        title={isPending ? "Cancel this release?" : "Revoke this release?"}
        message={
          isPending
            ? `This pending release for ${displayName} will be cancelled. ${patientName} will no longer see a signature request.`
            : `${patientName}'s release for ${displayName} will be revoked. You can create a new one at any time.`
        }
        confirmLabel={revoking ? "Processing…" : isPending ? "Cancel Release" : "Revoke Release"}
        onCancel={() => setRevokeOpen(false)}
        onConfirm={handleRevoke}
      />
    </View>
  );
}
