import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, ChevronRight, Stethoscope } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { mockProviders, insuranceMemberLine } from "@/mock/providers";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

export default function MyProviders() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const empty = mockProviders.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header
        title="My Providers"
        onBack={() => nav.goBack()}
        rightAction={{ icon: <Plus size={22} color={t.colors.primary} />, onPress: () => nav.navigate("AddProvider") }}
      />
      {empty ? (
        <Screen contentContainerStyle={{ alignItems: "center", justifyContent: "center", flexGrow: 1, gap: 12 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: t.colors.surfaceSubtle,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Stethoscope size={28} color={t.colors.textSecondary} />
          </View>
          <Text style={t.type.h3}>No providers yet</Text>
          <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 32 }]}>
            Add your hospitals, clinics, and insurers to keep your health records connected.
          </Text>
          <View style={{ marginTop: 8, alignSelf: "stretch" }}>
            <Button label="+ Add Provider" onPress={() => nav.navigate("AddProvider")} fullWidth />
          </View>
        </Screen>
      ) : (
        <Screen contentContainerStyle={{ gap: 12 }}>
          <View
            style={{
              backgroundColor: t.colors.surface,
              borderRadius: t.radius.card,
              borderWidth: 1,
              borderColor: t.colors.border,
              overflow: "hidden",
            }}
          >
            {mockProviders.map((p, i) => (
              <Pressable
                key={p.id}
                onPress={() => nav.navigate("ProviderDetail", { providerId: p.id })}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: t.colors.divider,
                  gap: 8,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={t.type.bodyStrong}>{p.organization}</Text>
                  <Text style={t.type.caption}>{insuranceMemberLine(p)}</Text>
                </View>
                <ChevronRight size={16} color={t.colors.textSecondary} />
              </Pressable>
            ))}
            <Pressable
              onPress={() => nav.navigate("AddProvider")}
              style={{
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: t.colors.divider,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Plus size={16} color={t.colors.primary} />
              <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Add Provider</Text>
            </Pressable>
          </View>
        </Screen>
      )}
    </View>
  );
}
