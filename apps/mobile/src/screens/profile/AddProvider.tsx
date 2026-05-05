import { useCallback, useState } from "react";
import { Alert, Modal, Pressable, Text, View, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Check, ChevronDown } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { CardImagePicker } from "@/components/CardImagePicker";
import { useTheme } from "@/theme/ThemeProvider";
import { listMyProviders, replaceMyProviders, type UserProvider, type MyProviderInput } from "@/lib/api";
import type { ProvidersParamList } from "@/navigation/types";

type R = RouteProp<ProvidersParamList, "AddProvider">;
type Nav = NativeStackNavigationProp<ProvidersParamList>;

type ProviderType = "Hospital" | "Facility" | "Insurance";
const PROVIDER_TYPES: ProviderType[] = ["Hospital", "Facility", "Insurance"];

function toInput(p: UserProvider): MyProviderInput {
  return {
    providerType: p.providerType as ProviderType,
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
    (existing?.providerType as ProviderType) ?? "Hospital"
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
  const [typePicker, setTypePicker] = useState(false);
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
      nav.goBack();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save provider.");
    } finally {
      setSaving(false);
    }
  }, [
    providerType, providerName, insurance,
    phone, fax, address, patientId, patientMemberId,
    groupId, planName, providerEmail, membershipIdFront, membershipIdBack,
    isEdit, existing, nav,
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
          <Pressable
            onPress={() => setTypePicker(true)}
            style={{
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
              borderWidth: 1,
              borderRadius: t.radius.button,
              paddingHorizontal: 14,
              height: 48,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={[t.type.body, { flex: 1, fontWeight: "600" }]}>{providerType}</Text>
            <ChevronDown size={18} color={t.colors.textSecondary} />
          </Pressable>
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
            <Input
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

      {/* Type picker modal */}
      <Modal transparent visible={typePicker} animationType="fade" onRequestClose={() => setTypePicker(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
          onPress={() => setTypePicker(false)}
        >
          <Pressable>
            <View
              style={{
                backgroundColor: t.colors.surface,
                borderTopLeftRadius: t.radius.card,
                borderTopRightRadius: t.radius.card,
                paddingBottom: 32,
                overflow: "hidden",
              }}
            >
              <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: t.colors.divider }}>
                <Text style={t.type.bodyStrong}>Provider Type</Text>
              </View>
              {PROVIDER_TYPES.map((type, i) => (
                <Pressable
                  key={type}
                  onPress={() => { setProviderType(type); setTypePicker(false); }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: t.colors.divider,
                  }}
                >
                  <Text style={[t.type.body, { flex: 1 }]}>{type}</Text>
                  {providerType === type && <Check size={18} color={t.colors.primary} />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
