import {
  Alert, Pressable, Text, View,
} from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "@/theme/ThemeProvider";
import type { ReleasesParamList } from "@/navigation/types";
import type { UserProvider, ReleaseProviderInput, CreateReleaseInput } from "@/lib/api";
import { getProfile, createRelease } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { SignaturePad, type SignaturePadRef } from "@/components/SignaturePad";
import { WizardShell } from "./_WizardShell";
import { useWizard } from "./_WizardContext";
import { returnToSetup } from "@/navigation/returnTo";

type Nav = NativeStackNavigationProp<ReleasesParamList>;

function displayName(p: UserProvider): string {
  return p.providerType === "Insurance" ? (p.insurance ?? p.providerName) : p.providerName;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function WizardStep5() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { wizard, setWizard } = useWizard();
  const { user } = useAuth();
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [creating, setCreating] = useState(false);
  const [patientName, setPatientName] = useState("");

  useFocusEffect(useCallback(() => {
    setWizard(prev => ({ ...prev, isEditing: false }));
  }, [setWizard]));

  useEffect(() => {
    getProfile().then((p) => {
      setPatientName(`${p.firstName ?? ""} ${p.lastName ?? ""}`.trim());
    }).catch(() => {});
  }, []);

  const providerDisplayName = wizard.provider ? displayName(wizard.provider) : "—";
  const validUntil = wizard.expiryDate
    ? `${formatDate(wizard.expiryDate)} · ${wizard.durationLabel}`
    : "—";
  const representativeName = !wizard.representativeLabel || wizard.representativeLabel === "Self-requested"
    ? "yourself"
    : wizard.representativeLabel;

  function editStep(navigate: () => void) {
    setWizard(prev => ({ ...prev, isEditing: true }));
    navigate();
  }

  const rows: { label: string; value: string; onEdit: () => void }[] = [
    {
      label: "Request records from",
      value: providerDisplayName,
      onEdit: () => editStep(() => nav.navigate("WizardStep1")),
    },
    {
      label: "Representative",
      value: wizard.representativeLabel || "Self-requested",
      onEdit: () => editStep(() => nav.navigate("WizardStep3")),
    },
    {
      label: "Records included",
      value: wizard.recordsSummary || "—",
      onEdit: () =>
        editStep(() =>
          nav.navigate("WizardStep2", {
            providerType: wizard.provider?.providerType ?? "",
            providerId: wizard.provider?.id ?? "",
          })
        ),
    },
    {
      label: "Valid until",
      value: validUntil,
      onEdit: () => editStep(() => nav.navigate("WizardStep4")),
    },
  ];

  async function handleCreate() {
    const sig = signaturePadRef.current?.getSignature();
    if (!sig) {
      Alert.alert("Signature Required", "Please sign before creating the release.");
      return;
    }
    if (!wizard.provider) {
      Alert.alert("Missing Info", "Please go back and select a provider.");
      return;
    }
    if (!wizard.fields) {
      Alert.alert("Missing Info", "Please go back and select records to release.");
      return;
    }
    if (!wizard.expiryDate) {
      Alert.alert("Missing Info", "Please go back and set an expiry date.");
      return;
    }

    try {
      setCreating(true);
      const profile = await getProfile();

      const missingFields: string[] = [];
      if (!profile.dateOfBirth) missingFields.push("date of birth");
      if (!profile.address) missingFields.push("mailing address");
      if (!profile.phoneNumber) missingFields.push("phone number");
      if (missingFields.length > 0) {
        Alert.alert(
          "Incomplete Profile",
          `Please complete your profile before creating a release. Missing: ${missingFields.join(", ")}.`
        );
        return;
      }

      const today = toLocalIsoDate(new Date());
      const expiryDateStr = toLocalIsoDate(wizard.expiryDate);

      const providerInput: ReleaseProviderInput = {
        providerName: wizard.provider.providerName || undefined,
        providerType: wizard.provider.providerType as "Insurance" | "Hospital" | "Facility",
        insurance: wizard.provider.insurance ?? undefined,
        patientId: wizard.provider.patientId ?? undefined,
        patientMemberId: wizard.provider.patientMemberId ?? undefined,
        groupId: wizard.provider.groupId ?? undefined,
        planName: wizard.provider.planName ?? undefined,
        phone: wizard.provider.phone ?? undefined,
        fax: wizard.provider.fax ?? undefined,
        providerEmail: wizard.provider.providerEmail ?? undefined,
        address: wizard.provider.address ?? undefined,
        membershipIdFront: wizard.provider.membershipIdFront ?? undefined,
        membershipIdBack: wizard.provider.membershipIdBack ?? undefined,
        ...wizard.fields,
        allAvailableDates: true,
        purpose: "At the request of the individual",
      };

      const isSelf = wizard.representativeId === "self";
      const input: CreateReleaseInput = {
        firstName: profile.firstName,
        middleName: profile.middleName || undefined,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth,
        mailingAddress: profile.address,
        phoneNumber: profile.phoneNumber,
        email: user?.email ?? "",
        ssn: (profile.ssn && profile.ssn.replace(/\D/g, "").length === 4) ? profile.ssn.replace(/\D/g, "") : null,
        providers: [providerInput],
        releaseAuthAgent: !isSelf,
        releaseAuthZabaca: false,
        authAgentName: isSelf ? undefined : wizard.representativeLabel,
        authExpirationDate: expiryDateStr,
        authPrintedName: sig.printedName || `${profile.firstName} ${profile.lastName}`.trim(),
        authSignatureImage: sig.image,
        authDate: today,
      };

      await createRelease(input);
      if (!returnToSetup(nav, wizard.returnTo)) nav.popToTop();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create release. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <WizardShell
      step={5}
      subtitle="Review & Sign"
      primaryLabel={creating ? "Creating…" : "Create Release"}
      onPrimary={handleCreate}
      primaryDisabled={creating}
    >
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: 14,
          gap: 4,
        }}
      >
        <Text style={[t.type.bodyStrong, { marginBottom: 4 }]}>Release Summary</Text>
        {rows.map((row, i) => (
          <View
            key={row.label}
            style={{
              paddingVertical: 10,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: t.colors.divider,
              gap: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={t.type.caption}>{row.label}</Text>
              <Pressable onPress={row.onEdit} hitSlop={8}>
                <Text style={{ color: t.colors.primary, fontWeight: "600", fontSize: 13 }}>Edit</Text>
              </Pressable>
            </View>
            <Text style={[t.type.body, { fontWeight: "600" }]}>{row.value}</Text>
          </View>
        ))}
      </View>

      <Text style={t.type.caption}>
        By signing, you authorize {representativeName} to request your health records from{" "}
        {providerDisplayName} for the period stated. You may revoke this release at any time.
      </Text>

      <SignaturePad ref={signaturePadRef} defaultName={patientName} />
    </WizardShell>
  );
}
