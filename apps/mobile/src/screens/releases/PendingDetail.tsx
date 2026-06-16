import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Pencil } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { SignaturePad, AMBER_TEXT, type SignaturePadRef } from "@/components/SignaturePad";
import { useTheme } from "@/theme/ThemeProvider";
import { getRelease, getProfile, signRelease, voidRelease, type ReleaseDetail, type ReleaseProvider } from "@/lib/api";
import type { ReleasesParamList } from "@/navigation/types";

type R = RouteProp<ReleasesParamList, "PendingDetail">;
type Nav = NativeStackNavigationProp<ReleasesParamList>;

function providerDisplayName(p: ReleaseProvider): string {
  return p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName;
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
  return checks.length > 0 ? checks.join(", ") : "All records";
}

function daysRemaining(date: string | null): number | null {
  if (!date) return null;
  const diff = new Date(date).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function PendingDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<R>();
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const [release, setRelease] = useState<ReleaseDetail | null>(null);
  const [patientName, setPatientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setRelease(await getRelease(params.releaseId));
    } catch {
      Alert.alert("Error", "Could not load release details.");
      nav.goBack();
    } finally {
      setLoading(false);
    }
  }, [params.releaseId, nav]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    getProfile().then((p) => {
      setPatientName(`${p.firstName ?? ""} ${p.lastName ?? ""}`.trim());
    }).catch(() => {});
  }, []);

  const handleSign = useCallback(async () => {
    const sig = signaturePadRef.current?.getSignature();
    if (!sig) {
      Alert.alert("Signature Required", "Please sign before activating the release.");
      return;
    }
    if (!release?.authExpirationDate) {
      Alert.alert("Missing Info", "This release is missing an expiration date.");
      return;
    }
    try {
      setSigning(true);
      await signRelease(params.releaseId, {
        signatureImage: sig.image,
        printedName: sig.printedName || patientName,
        authDate: toLocalIsoDate(new Date()),
        expirationDate: release.authExpirationDate,
        expirationEvent: release.authExpirationEvent ?? undefined,
      });
      nav.popToTop();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to activate release. Please try again.");
    } finally {
      setSigning(false);
    }
  }, [release, params.releaseId, patientName, nav]);

  const handleCancel = useCallback(async () => {
    try {
      await voidRelease(params.releaseId);
      setCancelOpen(false);
      nav.popToTop();
    } catch {
      setCancelOpen(false);
      Alert.alert("Error", "Could not cancel release. Please try again.");
    }
  }, [params.releaseId, nav]);

  const provider = release?.providers[0] ?? null;

  const representativeLabel = release
    ? release.releaseAuthAgent
      ? [release.authAgentFirstName, release.authAgentLastName].filter(Boolean).join(" ") || "Representative"
      : "Self-requested"
    : "—";

  const days = release ? daysRemaining(release.authExpirationDate) : null;

  const rows = release && provider ? [
    { label: "Release Code", value: release.releaseCode ?? "—" },
    { label: "Representative", value: representativeLabel },
    { label: "Records included", value: recordsList(provider) },
    {
      label: "Valid until",
      value: release.authExpirationDate
        ? `${formatDate(release.authExpirationDate)}${days !== null ? ` · ${days} days` : ""}`
        : "—",
    },
  ] : [];

  if (loading) {
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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={t.colors.primary} />
        </View>
      </View>
    );
  }

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

      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16, gap: 10 }}>
            <Button
              testID="release-sign"
              label={signing ? "Activating…" : "Sign & Activate"}
              onPress={handleSign}
              disabled={signing}
              fullWidth
            />
            <Button
              label="Cancel Release"
              variant="destructive"
              onPress={() => setCancelOpen(true)}
              disabled={signing}
              fullWidth
            />
          </View>
        }
        contentContainerStyle={{ gap: 12 }}
      >
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={[t.type.h2, { flex: 1, marginRight: 8 }]} numberOfLines={2}>
              {provider ? providerDisplayName(provider) : "—"}
            </Text>
            <Badge label="Pending" variant="accent" />
          </View>
        </View>

        <View
          style={{
            backgroundColor: "#FFF6E5",
            borderRadius: t.radius.card,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Pencil size={16} color={AMBER_TEXT} />
          <Text style={[t.type.caption, { color: AMBER_TEXT, flex: 1 }]}>
            Awaiting your signature to activate this release.
          </Text>
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
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              <Text style={[t.type.caption, { flex: 1 }]}>{row.label}</Text>
              <Text style={[t.type.body, { fontWeight: "600" }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <SignaturePad ref={signaturePadRef} defaultName={patientName} />
      </Screen>

      <ConfirmDrawer
        visible={cancelOpen}
        title="Cancel this release?"
        message="This pending release will be discarded. You can create a new one any time."
        confirmLabel="Cancel Release"
        onCancel={() => setCancelOpen(false)}
        onConfirm={handleCancel}
      />
    </View>
  );
}
