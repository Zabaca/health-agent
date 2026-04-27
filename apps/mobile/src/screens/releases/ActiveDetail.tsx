import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar, Copy, Printer, FileDown, Ban, ArrowLeft } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { mockReleases } from "@/mock/releases";
import type { ReleasesParamList } from "@/navigation/types";

type R = RouteProp<ReleasesParamList, "ActiveDetail">;
type Nav = NativeStackNavigationProp<ReleasesParamList>;

export default function ActiveDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [revokeOpen, setRevokeOpen] = useState(false);
  const { params } = useRoute<R>();
  const release = mockReleases.find((r) => r.id === params.releaseId) ?? mockReleases[0];

  const rows = [
    { label: "Release Code", value: release.code, copy: true },
    { label: "Representative", value: release.representative },
    { label: "Records included", value: release.recordsIncluded },
    { label: "Request type", value: release.requestType },
    { label: "Created", value: release.createdOn },
  ];

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
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => nav.navigate("FaxDialog")}
                style={{ flex: 1, height: 48, borderRadius: t.radius.button, borderWidth: 1, borderColor: t.colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
              >
                <Printer size={16} color={t.colors.primary} />
                <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Fax Request</Text>
              </Pressable>
              <Pressable
                onPress={() => nav.navigate("ExportPDF", { releaseId: release.id })}
                style={{ flex: 1, height: 48, borderRadius: t.radius.button, borderWidth: 1, borderColor: t.colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
              >
                <FileDown size={16} color={t.colors.primary} />
                <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Export PDF</Text>
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
            <Text style={t.type.h2}>{release.provider}</Text>
            <Badge label="Active" variant="success" />
          </View>
          <Text style={t.type.caption}>{release.providerSubtitle}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
            <Calendar size={14} color={t.colors.primary} />
            <Text style={[t.type.caption, { color: t.colors.primary }]}>
              Valid until {release.validUntil} · {release.daysRemaining} days remaining
            </Text>
          </View>
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
              <Text style={[t.type.body, { fontWeight: "600", marginRight: row.copy ? 8 : 0 }]}>{row.value}</Text>
              {row.copy ? <Copy size={14} color={t.colors.textSecondary} /> : null}
            </View>
          ))}
        </View>
      </Screen>

      <ConfirmDrawer
        visible={revokeOpen}
        title="Revoke this release?"
        message={`${release.provider} will no longer be authorized to share records under code ${release.code}. You can create a new release any time.`}
        confirmLabel="Revoke Release"
        onCancel={() => setRevokeOpen(false)}
        onConfirm={() => { setRevokeOpen(false); nav.popToTop(); }}
      />
    </View>
  );
}
