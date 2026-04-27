import { useState } from "react";
import { Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { mockProviders } from "@/mock/providers";
import type { ProfileParamList } from "@/navigation/types";

type R = RouteProp<ProfileParamList, "ProviderDetail">;
type Nav = NativeStackNavigationProp<ProfileParamList>;

export default function ProviderDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const p = mockProviders.find((x) => x.id === params.providerId) ?? mockProviders[0];
  const [removeOpen, setRemoveOpen] = useState(false);

  const rows = [
    { label: "ORGANIZATION", value: p.organization },
    { label: "TYPE", value: p.type },
    p.physician ? { label: "PHYSICIAN", value: p.physician } : null,
    p.phone ? { label: "PHONE", value: p.phone } : null,
    p.fax ? { label: "FAX", value: p.fax } : null,
    p.address ? { label: "ADDRESS", value: p.address } : null,
    p.patientId ? { label: "PATIENT ID", value: p.patientId } : null,
    p.memberNumber ? { label: "MEMBER #", value: p.memberNumber } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Provider Detail" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16, gap: 10 }}>
            <Button label="Edit Provider" variant="secondary" onPress={() => nav.navigate("AddProvider")} fullWidth />
            <Button label="Remove Provider" variant="destructive" onPress={() => setRemoveOpen(true)} fullWidth />
          </View>
        }
        contentContainerStyle={{ gap: 8 }}
      >
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
      </Screen>

      <ConfirmDrawer
        visible={removeOpen}
        title={`Remove ${p.organization}?`}
        message="This provider will be removed from your saved providers. Existing releases that reference them are not affected."
        confirmLabel="Remove Provider"
        onCancel={() => setRemoveOpen(false)}
        onConfirm={() => { setRemoveOpen(false); nav.goBack(); }}
      />
    </View>
  );
}
