import { useState } from "react";
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal,
  Platform, Pressable, ScrollView, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { CardImagePicker } from "@/components/CardImagePicker";
import { listMyProviders, replaceMyProviders, type MyProviderInput } from "@/lib/api";

type ProviderType = "Hospital" | "Facility" | "Insurance";
const TYPES: ProviderType[] = ["Hospital", "Facility", "Insurance"];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
};

function toInput(p: Awaited<ReturnType<typeof listMyProviders>>[number]): MyProviderInput {
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

export function QuickAddProviderDrawer({ visible, onClose, onSaved }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [providerType, setProviderType] = useState<ProviderType>("Hospital");
  const [providerName, setProviderName] = useState("");
  const [insurance, setInsurance] = useState("");
  const [phone, setPhone] = useState("");
  const [fax, setFax] = useState("");
  const [address, setAddress] = useState("");
  const [patientId, setPatientId] = useState("");
  const [patientMemberId, setPatientMemberId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [planName, setPlanName] = useState("");
  const [providerEmail, setProviderEmail] = useState("");
  const [membershipIdFront, setMembershipIdFront] = useState<string | null>(null);
  const [membershipIdBack, setMembershipIdBack] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isInsurance = providerType === "Insurance";

  function reset() {
    setProviderType("Hospital");
    setProviderName("");
    setInsurance("");
    setPhone("");
    setFax("");
    setAddress("");
    setPatientId("");
    setPatientMemberId("");
    setGroupId("");
    setPlanName("");
    setProviderEmail("");
    setMembershipIdFront(null);
    setMembershipIdBack(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleSave() {
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
      await replaceMyProviders([...current.map(toInput), input]);
      reset();
      onSaved();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save provider.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Backdrop */}
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)" }}
          onPress={handleClose}
        />

        {/* Sheet */}
        <View
          style={{
            backgroundColor: t.colors.bg,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: insets.bottom + 16,
            maxHeight: "90%",
          }}
        >
          {/* Drag handle */}
          <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: t.spacing.gutter,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: t.colors.divider,
            }}
          >
            <Text style={[t.type.h3, { flex: 1 }]}>Add Provider</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={20} color={t.colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ padding: t.spacing.gutter, gap: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Provider Type chips */}
            <View style={{ gap: 6 }}>
              <Text style={t.type.rowLabel}>PROVIDER TYPE</Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {TYPES.map((type) => {
                  const on = type === providerType;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setProviderType(type)}
                      style={{
                        flex: 1,
                        height: 38,
                        borderRadius: t.radius.pill,
                        borderWidth: 1,
                        borderColor: on ? t.colors.primary : t.colors.border,
                        backgroundColor: on ? t.colors.primaryBg : t.colors.surface,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "600",
                          color: on ? t.colors.primary : t.colors.textSecondary,
                        }}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Type-specific fields */}
            {isInsurance ? (
              <>
                <Input
                  label="Insurance Name"
                  placeholder="e.g. Blue Cross Blue Shield"
                  value={insurance}
                  onChangeText={setInsurance}
                  autoFocus
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
                  autoFocus
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

            {/* Shared fields */}
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

            <Button
              label={saving ? "Saving…" : "Save Provider"}
              onPress={handleSave}
              disabled={saving}
              fullWidth
            />
          </ScrollView>

          {saving && (
            <View
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: "rgba(255,255,255,0.6)",
                alignItems: "center",
                justifyContent: "center",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
              }}
            >
              <ActivityIndicator color={t.colors.primary} size="large" />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
