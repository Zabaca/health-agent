import { useCallback, useState } from "react";
import { Alert, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { AuthenticatedImage } from "@/components/AuthenticatedImage";
import { ProviderAvatar } from "@/components/ProviderAvatar";
import { useTheme } from "@/theme/ThemeProvider";
import { listMyProviders, replaceMyProviders, type UserProvider, type MyProviderInput } from "@/lib/api";
import type { ProvidersParamList } from "@/navigation/types";

type R = RouteProp<ProvidersParamList, "ProviderDetail">;
type Nav = NativeStackNavigationProp<ProvidersParamList>;

function toInput(p: UserProvider): MyProviderInput {
  return {
    providerType: p.providerType as MyProviderInput["providerType"],
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

export default function ProviderDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const p = params.provider;
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

  const displayName = p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName;

  const rows = [
    { label: p.providerType === "Insurance" ? "INSURANCE" : "PROVIDER", value: displayName },
    { label: "TYPE", value: p.providerType },
    p.physicianName ? { label: "PHYSICIAN", value: p.physicianName } : null,
    p.phone ? { label: "PHONE", value: p.phone } : null,
    p.fax ? { label: "FAX", value: p.fax } : null,
    p.address ? { label: "ADDRESS", value: p.address } : null,
    p.patientId ? { label: "PATIENT ID", value: p.patientId } : null,
    p.patientMemberId ? { label: "MEMBER ID", value: p.patientMemberId } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  const handleRemove = useCallback(async () => {
    try {
      setRemoving(true);
      const current = await listMyProviders();
      const updated = current.filter((x) => x.id !== p.id).map(toInput);
      await replaceMyProviders(updated);
      setRemoveOpen(false);
      nav.goBack();
    } catch (e) {
      setRemoveOpen(false);
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to remove provider.");
    } finally {
      setRemoving(false);
    }
  }, [p.id, nav]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Provider Detail" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16, gap: 10 }}>
            <Button
              label="Edit Provider"
              variant="secondary"
              onPress={() => nav.navigate("AddProvider", { provider: p })}
              fullWidth
            />
            <Button
              label="Remove Provider"
              variant="destructive"
              onPress={() => setRemoveOpen(true)}
              fullWidth
            />
          </View>
        }
        contentContainerStyle={{ gap: 12 }}
      >
        <View style={{ alignItems: "center", paddingVertical: 8, gap: 8 }}>
          <ProviderAvatar type={p.providerType} size={56} />
          <Text style={t.type.h3}>{displayName}</Text>
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
                gap: 4,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              <Text style={t.type.rowLabel}>{row.label}</Text>
              <Text style={t.type.body}>{row.value}</Text>
            </View>
          ))}
        </View>

        {p.providerType === "Insurance" && (p.membershipIdFront || p.membershipIdBack) && (
          <View style={{ gap: 10 }}>
            {p.membershipIdFront && (
              <View style={{ gap: 6 }}>
                <Text style={t.type.rowLabel}>MEMBERSHIP CARD (FRONT)</Text>
                <AuthenticatedImage
                  uri={p.membershipIdFront}
                  style={{ width: "100%", aspectRatio: 85.6 / 54, borderRadius: t.radius.card, backgroundColor: t.colors.surfaceSubtle }}
                />
              </View>
            )}
            {p.membershipIdBack && (
              <View style={{ gap: 6 }}>
                <Text style={t.type.rowLabel}>MEMBERSHIP CARD (BACK)</Text>
                <AuthenticatedImage
                  uri={p.membershipIdBack}
                  style={{ width: "100%", aspectRatio: 85.6 / 54, borderRadius: t.radius.card, backgroundColor: t.colors.surfaceSubtle }}
                />
              </View>
            )}
          </View>
        )}
      </Screen>

      <ConfirmDrawer
        visible={removeOpen}
        title={`Remove ${displayName}?`}
        message="This provider will be removed from your saved providers. Existing releases that reference them are not affected."
        confirmLabel={removing ? "Removing…" : "Remove Provider"}
        onCancel={() => setRemoveOpen(false)}
        onConfirm={handleRemove}
      />
    </View>
  );
}
