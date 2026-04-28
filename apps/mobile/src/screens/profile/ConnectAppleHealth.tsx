import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Activity, Moon, FlaskConical, Footprints, Heart } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

const items = [
  { id: "vitals", label: "Heart Rate & Vitals", Icon: Activity },
  { id: "sleep", label: "Sleep Analysis", Icon: Moon },
  { id: "labs", label: "Lab Results", Icon: FlaskConical },
  { id: "steps", label: "Steps & Activity", Icon: Footprints },
];

export default function ConnectAppleHealth() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ gap: 18, paddingTop: 32, alignItems: "stretch" }}>
        <View style={{ alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: t.colors.surface,
              borderWidth: 1,
              borderColor: t.colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Heart size={28} color={t.colors.destructive} />
          </View>
          <Text style={t.type.h2}>Connect Apple Health</Text>
          <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 16 }]}>
            Sync your vitals, labs, sleep, and activity data automatically.
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
          {items.map((it, i) => (
            <View
              key={it.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              <it.Icon size={18} color={t.colors.primary} />
              <Text style={t.type.body}>{it.label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => nav.goBack()}
          style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
        >
          <Heart size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Connect Apple Health</Text>
        </Pressable>

        <Pressable onPress={() => nav.goBack()} style={{ alignItems: "center", padding: 8 }}>
          <Text style={t.type.caption}>Skip for now</Text>
        </Pressable>
      </Screen>
    </View>
  );
}
