import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { mockProviders } from "@/mock/providers";
import type { PdaProvidersParamList } from "@/navigation/types";

type R = RouteProp<PdaProvidersParamList, "PdaProviderDetail">;
type Nav = NativeStackNavigationProp<PdaProvidersParamList>;

const types = ["Hospital", "Facility", "Insurance"];

export default function PdaProviderDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const provider = mockProviders.find((p) => p.id === params.providerId) ?? mockProviders[0];
  const [type, setType] = useState(0);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header
        title="Provider Details"
        onBack={() => nav.goBack()}
        rightAction={{ label: "Save", onPress: () => nav.goBack() }}
      />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Pressable
              onPress={() => setDeleteOpen(true)}
              style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.destructive, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Delete Provider</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ gap: 12 }}
      >
        <Input label="Provider Name" defaultValue={provider.organization} />

        <View style={{ gap: 6 }}>
          <Text style={t.type.rowLabel}>Provider Type</Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: t.colors.surfaceSubtle,
              borderRadius: t.radius.button,
              padding: 4,
            }}
          >
            {types.map((label, i) => {
              const on = i === type;
              return (
                <Pressable
                  key={label}
                  onPress={() => setType(i)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: on ? t.colors.primary : "transparent",
                  }}
                >
                  <Text style={{ color: on ? "#FFFFFF" : t.colors.textPrimary, fontWeight: "600", fontSize: 13 }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input label="Physician Name" defaultValue={provider.physician} />
        <Input label="Phone" defaultValue={provider.phone} keyboardType="phone-pad" />
        <Input label="Fax" defaultValue={provider.fax} keyboardType="phone-pad" />
        <Input label="Email" placeholder="Optional" autoCapitalize="none" keyboardType="email-address" />
        <Input label="Address" defaultValue={provider.address} multiline />
      </Screen>

      <ConfirmDrawer
        visible={deleteOpen}
        title={`Delete ${provider.organization}?`}
        message="This provider will be removed from the patient's list. Existing releases that reference them are not affected."
        confirmLabel="Delete Provider"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => { setDeleteOpen(false); nav.goBack(); }}
      />
    </View>
  );
}
