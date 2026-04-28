import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Hourglass } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { findPatient, mockPda } from "@/mock/pda";
import type { PdaReleasesParamList } from "@/navigation/types";

type R = RouteProp<PdaReleasesParamList, "PdaReleaseDetail">;
type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

export default function PdaReleaseDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { representing } = useRole();
  const patient = findPatient(representing);
  const isPending = params.releaseId === "rel2";
  const [confirmOpen, setConfirmOpen] = useState(false);

  const actionLabel = isPending ? "Cancel Release" : "Revoke Release";
  const providerName = isPending ? "Heart Care Clinic" : "Valley Medical Center";

  const rows = [
    { label: "Release Code", value: isPending ? "NP7QR2MX" : "LMQ3X8K2" },
    { label: "Provider", value: isPending ? "Heart Care Clinic" : "Valley Medical Center" },
    { label: "Record Types", value: isPending ? "All Records" : "Labs, Imaging" },
    { label: "Expiry", value: isPending ? "Jun 30, 2026" : "Dec 31, 2026" },
    { label: "Representative", value: `You (${mockPda.name})`, tint: true },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Release Detail" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Pressable
              onPress={() => setConfirmOpen(true)}
              style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.destructive, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>{actionLabel}</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        {isPending ? (
          <View
            style={{
              backgroundColor: "#FFF6E5",
              borderRadius: t.radius.card,
              padding: 14,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
            }}
          >
            <Hourglass size={16} color={t.colors.accent} />
            <Text style={[t.type.caption, { color: t.colors.accent, flex: 1 }]}>
              Awaiting patient signature. {patient.name} must review and sign this release.
            </Text>
          </View>
        ) : null}

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
              <Text style={[t.type.body, { fontWeight: "600", color: row.tint ? t.colors.primary : t.colors.textPrimary }]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </Screen>

      <ConfirmDrawer
        visible={confirmOpen}
        title={isPending ? "Cancel this release?" : "Revoke this release?"}
        message={
          isPending
            ? `This pending release for ${providerName} will be cancelled. ${patient.name} will no longer see a signature request.`
            : `${patient.name}'s release for ${providerName} will be revoked.`
        }
        confirmLabel={actionLabel}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); nav.goBack(); }}
      />
    </View>
  );
}
