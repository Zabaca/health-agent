import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, Settings, Repeat } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { mockUser } from "@/mock/user";
import { mockProviders } from "@/mock/providers";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

export default function Profile() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { switchTo } = useRole();
  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text
          style={[t.type.h1, { flex: 1 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          Profile
        </Text>
        <Pressable onPress={() => nav.navigate("AccountSettings")}>
          <Settings size={22} color={t.colors.textPrimary} />
        </Pressable>
      </View>

      <Pressable onPress={() => nav.navigate("EditProfile")}>
        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.border,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: t.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: t.colors.primary, fontWeight: "700" }}>
              {mockUser.firstName[0]}{mockUser.lastName[0]}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={t.type.bodyStrong}>{mockUser.firstName} {mockUser.lastName}</Text>
            <Text style={t.type.caption}>{mockUser.email}</Text>
          </View>
          <ChevronRight size={18} color={t.colors.textSecondary} />
        </View>
      </Pressable>

      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          overflow: "hidden",
        }}
      >
        <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, backgroundColor: t.colors.surfaceSubtle }}>
          <Text style={[t.type.sectionLabel, { textTransform: "uppercase" }]}>HEALTH SOURCES</Text>
        </View>
        <Pressable onPress={() => nav.navigate("ConnectAppleHealth")}>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.accent }} />
            <Text style={[t.type.body, { flex: 1 }]}>Apple Health</Text>
            <Text style={{ color: t.colors.accent, fontWeight: "600" }}>Tap to connect</Text>
          </View>
        </Pressable>
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
        <Pressable onPress={() => nav.navigate("MyProviders")}>
          <View
            style={{
              paddingHorizontal: 14,
              paddingTop: 12,
              paddingBottom: 8,
              backgroundColor: t.colors.surfaceSubtle,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={[t.type.sectionLabel, { textTransform: "uppercase", flex: 1 }]}>MY PROVIDERS</Text>
            <ChevronRight size={16} color={t.colors.textSecondary} />
          </View>
        </Pressable>
        {mockProviders
          .filter((p) => p.physician && p.specialty)
          .slice(0, 2)
          .map((p, i) => (
            <Pressable key={p.id} onPress={() => nav.navigate("ProviderDetail", { providerId: p.id })}>
              <View
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
                <Text style={[t.type.body, { flex: 1 }]}>
                  <Text style={{ fontWeight: "600" }}>{p.physician}</Text>
                  <Text style={{ color: t.colors.textSecondary }}> — {p.specialty}</Text>
                </Text>
                <ChevronRight size={16} color={t.colors.textSecondary} />
              </View>
            </Pressable>
          ))}
      </View>

      <Pressable
        onPress={() => switchTo("pda", "marcus")}
        style={{
          backgroundColor: "#EAF1FB",
          borderRadius: t.radius.card,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <Repeat size={18} color="#4A78C8" />
        <Text style={[t.type.bodyStrong, { color: "#4A78C8", flex: 1 }]}>Switch to PDA View</Text>
        <ChevronRight size={18} color="#4A78C8" />
      </Pressable>

    </Screen>
  );
}
