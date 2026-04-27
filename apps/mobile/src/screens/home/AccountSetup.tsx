import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowRight, Circle, ChevronRight } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import type { HomeParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<HomeParamList>;

const steps = [
  {
    id: "profile",
    title: "Complete your profile",
    body: "Add your name, date of birth, and contact info so providers can identify you.",
  },
  {
    id: "release",
    title: "Create your first release",
    body: "Authorize your agent to request health records from your providers. Select providers and record types.",
  },
];

export default function AccountSetup() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Account Setup" onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ gap: 16 }}>
        <Text style={t.type.caption}>Complete these steps to get the most from Health Agent.</Text>

        {steps.map((s) => (
          <Pressable key={s.id} onPress={() => nav.goBack()}>
            <View
              style={{
                backgroundColor: t.colors.surface,
                borderRadius: t.radius.card,
                borderWidth: 1,
                borderColor: t.colors.border,
                padding: 16,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <Circle size={20} color={t.colors.borderMuted} />
                <Text style={[t.type.bodyStrong, { flex: 1 }]}>{s.title}</Text>
                <ChevronRight size={20} color={t.colors.textSecondary} />
              </View>
              <Text style={[t.type.body, { paddingLeft: 30 }]}>{s.body}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 30, marginTop: 4 }}>
                <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Get started</Text>
                <ArrowRight size={14} color={t.colors.primary} />
              </View>
            </View>
          </Pressable>
        ))}
      </Screen>
    </View>
  );
}
