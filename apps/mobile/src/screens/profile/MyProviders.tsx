import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, ChevronRight, Stethoscope } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/theme/ThemeProvider";
import { mockProviders, insuranceMemberLine } from "@/mock/providers";
import type { ProvidersParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProvidersParamList>;

export default function MyProviders() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const empty = mockProviders.length === 0;

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: empty ? 1 : undefined }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text
          style={[t.type.h1, { flex: 1 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          My Providers
        </Text>
        <Pressable
          onPress={() => nav.navigate("AddProvider")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: t.colors.primary,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: t.radius.pill,
          }}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Add</Text>
        </Pressable>
      </View>

      {empty ? (
        <EmptyState
          icon={<Stethoscope size={32} color={t.colors.textSecondary} />}
          title="No providers yet"
          subtitle="Add your hospitals, clinics, and insurers to keep your health records connected."
          actions={[
            {
              label: "Add Provider",
              icon: <Plus size={16} color="#FFFFFF" />,
              onPress: () => nav.navigate("AddProvider"),
            },
          ]}
        />
      ) : (
        mockProviders.map((p) => (
          <Pressable key={p.id} onPress={() => nav.navigate("ProviderDetail", { providerId: p.id })}>
            <View
              style={{
                backgroundColor: t.colors.surface,
                borderRadius: t.radius.card,
                borderWidth: 1,
                borderColor: t.colors.border,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={t.type.bodyStrong}>{p.organization}</Text>
                <Text style={t.type.caption}>{insuranceMemberLine(p)}</Text>
              </View>
              <ChevronRight size={18} color={t.colors.textSecondary} />
            </View>
          </Pressable>
        ))
      )}
    </Screen>
  );
}
