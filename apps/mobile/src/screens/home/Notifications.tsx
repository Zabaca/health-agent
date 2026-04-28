import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowRight } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import { mockNotifications } from "@/mock/notifications";
import type { HomeParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<HomeParamList>;

export default function Notifications() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Notifications" onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ paddingTop: 8, gap: 0 }}>
        {mockNotifications.map((n, i) => (
          <View
            key={n.id}
            style={{
              paddingVertical: 14,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: t.colors.divider,
              gap: 4,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {n.unread ? (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary }} />
              ) : (
                <View style={{ width: 8, height: 8 }} />
              )}
              <Text style={t.type.bodyStrong}>{n.title}</Text>
            </View>
            <Text style={t.type.body}>{n.body}</Text>
            <Text style={[t.type.caption, { marginTop: 2 }]}>{n.when}</Text>
            <Pressable style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Text style={{ color: t.colors.primary, fontWeight: "600" }}>{n.cta}</Text>
              <ArrowRight size={14} color={t.colors.primary} />
            </Pressable>
          </View>
        ))}
      </Screen>
    </View>
  );
}
