import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { AddressAutocompleteInput } from "@/components/AddressAutocompleteInput";
import { Button } from "@/components/Button";
import { CardImagePicker } from "@/components/CardImagePicker";
import { useTheme } from "@/theme/ThemeProvider";
import { listMyProviders, replaceMyProviders, type UserProvider, type MyProviderInput } from "@/lib/api";
import type { ProvidersParamList } from "@/navigation/types";
import { returnToSetup } from "@/navigation/returnTo";

type R = RouteProp<ProvidersParamList, "AddProvider">;
type Nav = NativeStackNavigationProp<ProvidersParamList>;

type ProviderType = "Hospital" | "Facility" | "Insurance";
const PROVIDER_TYPES: ProviderType[] = ["Hospital", "Facility", "Insurance"];

function normalizeType(raw: string | null | undefined): ProviderType {
  return PROVIDER_TYPES.includes(raw as ProviderType) ? (raw as ProviderType) : "Hospital";
}

function toInput(p: UserProvider): MyProviderInput {
  return {
    providerType: normalizeType(p.providerType),
    providerName: p.providerName,
    insurance: p.insurance ?? undefined,
    physicianName: p.physicianName ?? undefined,
    phone: p.phone ?? undefined,
    fax: p.fax ?? undefined,
    address: p.address ?? undefined,
    patientId: p.patientId ?? undefined,
    patientMemberId: p.patientMemberId ?? undefined,
    groupId: p.groupId ?? undefined,
    planName: p.planName ?? undefined,
    providerEmail: p.providerEmail ?? undefined,
    membershipIdFront: p.membershipIdFront ?? undefined,
    membershipIdBack: p.membershipIdBack ?? undefined,
  };
}

export default function AddProvider() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const existing = params?.provider;
  const isEdit = !!existing;

  const [providerType, setProviderType] = useState<ProviderType>(
    normalizeType(existing?.providerType)
  );
  const [providerName, setProviderName] = useState(existing?.providerName ?? "");
  const [insurance, setInsurance] = useState(existing?.insurance ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [fax, setFax] = useState(existing?.fax ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [patientId, setPatientId] = useState(existing?.patientId ?? "");
  const [patientMemberId, setPatientMemberId] = useState(existing?.patientMemberId ?? "");
  const [groupId, setGroupId] = useState(existing?.groupId ?? "");
  const [planName, setPlanName] = useState(existing?.planName ?? "");
  const [providerEmail, setProviderEmail] = useState(existing?.providerEmail ?? "");
  const [membershipIdFront, setMembershipIdFront] = useState<string | null>(existing?.membershipIdFront ?? null);
  const [membershipIdBack, setMembershipIdBack] = useState<string | null>(existing?.membershipIdBack ?? null);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    const isInsurance = providerType === "Insurance";
    const name = isInsurance ? insurance.trim() : providerName.trim();
    if (!name) {
      Alert.alert("Required", isInsurance ? "Insurance name is required." : "Provider name is required.");
      return;
    }
    if (isInsurance && !patientMemberId.trim()) {
      Alert.alert("Required", "Member ID is required.");
      return;
    }
    if (isInsurance && !membershipIdFront) {
      Alert.alert("Required", "Please add your insurance card front image.");
      return;
    }
    if (isInsurance && !membershipIdBack) {
      Alert.alert("Required", "Please add your insurance card back image.");
      return;
    }

    const input: MyProviderInput = {
      providerType,
      providerName: providerName.trim(),
      insurance: isInsurance ? insurance.trim() : undefined,
      phone: phone.trim() || undefined,
      fax: fax.trim() || undefined,
      address: !isInsurance ? address.trim() || undefined : undefined,
      patientId: providerType === "Hospital" ? patientId.trim() || undefined : undefined,
      patientMemberId: isInsurance ? patientMemberId.trim() || undefined : undefined,
      groupId: isInsurance ? groupId.trim() || undefined : undefined,
      planName: isInsurance ? planName.trim() || undefined : undefined,
      providerEmail: providerEmail.trim() || undefined,
      membershipIdFront: isInsurance ? membershipIdFront ?? undefined : undefined,
      membershipIdBack: isInsurance ? membershipIdBack ?? undefined : undefined,
    };

    try {
      setSaving(true);
      const current = await listMyProviders();
      const updated: MyProviderInput[] = isEdit
        ? current.map((p) => (p.id === existing!.id ? input : toInput(p)))
        : [...current.map(toInput), input];
      await replaceMyProviders(updated);
      if (isEdit) {
        nav.goBack();
      } else if (!returnToSetup(nav, params?.returnTo)) {
        // Adding (not from setup) can still be entered cross-tab, which leaves
        // no MyProviders beneath AddProvider to goBack to. Reset the stack so we
        // deterministically land on the providers list with the new entry.
        nav.reset({ index: 0, routes: [{ name: "MyProviders" }] });
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save provider.");
    } finally {
      setSaving(false);
    }
  }, [
    providerType, providerName, insurance,
    phone, fax, address, patientId, patientMemberId,
    groupId, planName, providerEmail, membershipIdFront, membershipIdBack,
    isEdit, existing, nav, params,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title={isEdit ? "Edit Provider" : "Add Provider"} onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Button
              label={saving ? "Saving…" : isEdit ? "Save Changes" : "Save Provider"}
              onPress={save}
              fullWidth
              disabled={saving}
            />
          </View>
        }
        contentContainerStyle={{ gap: 12 }}
      >
        {/* Type picker */}
        <View style={{ gap: 6 }}>
          <Text style={t.type.rowLabel}>PROVIDER TYPE</Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: t.colors.surfaceSubtle,
              borderRadius: t.radius.button,
              padding: 4,
            }}
          >
            {PROVIDER_TYPES.map((type) => {
              const on = providerType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setProviderType(type)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: on ? t.colors.primary : "transparent",
                  }}
                >
                  <Text style={{ color: on ? "#FFFFFF" : t.colors.textPrimary, fontWeight: "600", fontSize: 13 }}>
                    {type}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {providerType === "Insurance" ? (
          <>
            <Input
              label="Insurance Name"
              placeholder="e.g. Blue Cross Blue Shield"
              value={insurance}
              onChangeText={setInsurance}
              required
            />
            <Input
              label="Insurance Member ID"
              placeholder="Your member ID"
              value={patientMemberId}
              onChangeText={setPatientMemberId}
              required
            />
            <Input
              label="Insurance Group ID (optional)"
              placeholder="Your group ID"
              value={groupId}
              onChangeText={setGroupId}
            />
            <Input
              label="Insurance Plan Name (optional)"
              placeholder="e.g. Gold PPO"
              value={planName}
              onChangeText={setPlanName}
            />
            <CardImagePicker
              label="Membership Card (Front)"
              value={membershipIdFront}
              onChange={setMembershipIdFront}
              required
            />
            <CardImagePicker
              label="Membership Card (Back)"
              value={membershipIdBack}
              onChange={setMembershipIdBack}
              required
            />
            <Input
              label="Medical Group Name (optional)"
              placeholder="e.g. Partners Healthcare"
              value={providerName}
              onChangeText={setProviderName}
            />
          </>
        ) : (
          <>
            <Input
              testID="provider-name"
              label="Individual / Organization Name"
              placeholder="e.g. Mass General Hospital"
              value={providerName}
              onChangeText={setProviderName}
              required
            />
            {providerType === "Hospital" && (
              <Input
                label="Patient ID (optional)"
                placeholder="Your ID at this provider"
                value={patientId}
                onChangeText={setPatientId}
              />
            )}
            <AddressAutocompleteInput
              label="Address (optional)"
              placeholder="123 Main St, Boston, MA 02114"
              value={address}
              onChangeText={setAddress}
            />
          </>
        )}

        <Input
          label="Phone (optional)"
          placeholder="(617) 555-0100"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        <Input
          label="Fax (optional)"
          placeholder="(617) 555-0101"
          keyboardType="phone-pad"
          value={fax}
          onChangeText={setFax}
        />
        <Input
          label="Email (optional)"
          placeholder="provider@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={providerEmail}
          onChangeText={setProviderEmail}
        />
      </Screen>

      {saving && (
        <View style={{
          ...StyleSheet_absoluteFill,
          backgroundColor: "rgba(0,0,0,0.15)",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <ActivityIndicator color={t.colors.primary} size="large" />
        </View>
      )}
    </View>
  );
}

const StyleSheet_absoluteFill = {
  position: "absolute" as const,
  top: 0, left: 0, right: 0, bottom: 0,
};
