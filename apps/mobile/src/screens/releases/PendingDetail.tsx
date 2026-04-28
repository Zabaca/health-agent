import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Pencil, ArrowLeft } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { mockReleases } from "@/mock/releases";
import type { ReleasesParamList } from "@/navigation/types";

type R = RouteProp<ReleasesParamList, "PendingDetail">;
type Nav = NativeStackNavigationProp<ReleasesParamList>;

export default function PendingDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [cancelOpen, setCancelOpen] = useState(false);
  const { params } = useRoute<R>();
  const release = mockReleases.find((r) => r.id === params.releaseId) ?? mockReleases[1];
  const rows = [
    { label: "Release Code", value: release.code },
    { label: "Representative", value: release.representative },
    { label: "Records included", value: release.recordsIncluded },
    { label: "Valid until", value: `${release.validUntil} · ${release.daysRemaining} days` },
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
            <Button label="Create Release" onPress={() => nav.popToTop()} fullWidth />
            <Button label="Cancel Release" variant="destructive" onPress={() => setCancelOpen(true)} fullWidth />
          </View>
        }
        contentContainerStyle={{ gap: 12 }}
      >
        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={t.type.h2}>{release.provider}</Text>
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
          <Pencil size={16} color={t.colors.accent} />
          <Text style={[t.type.caption, { color: t.colors.accent, flex: 1 }]}>
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

        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: t.colors.borderMuted,
            height: 110,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Pencil size={18} color={t.colors.textSecondary} />
          <Text style={t.type.caption}>Draw or tap to sign</Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Pressable><Text style={{ color: t.colors.primary, fontWeight: "600" }}>Clear</Text></Pressable>
        </View>
      </Screen>

      <ConfirmDrawer
        visible={cancelOpen}
        title="Cancel this release?"
        message="This pending release will be discarded. You can create a new one any time."
        confirmLabel="Cancel Release"
        onCancel={() => setCancelOpen(false)}
        onConfirm={() => { setCancelOpen(false); nav.popToTop(); }}
      />
    </View>
  );
}
