import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Download } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import type { ReleasesParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ReleasesParamList>;

export default function ExportPDF() {
  const t = useTheme();
  const nav = useNavigation<Nav>();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header variant="close" title="Export PDF" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Pressable
              onPress={() => nav.goBack()}
              style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
            >
              <Download size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Save to Files</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ alignItems: "center", gap: 16, paddingTop: 24 }}
      >
        <View style={{ width: 200, aspectRatio: 0.7, backgroundColor: "#FFFFFF", borderRadius: 8, borderWidth: 1, borderColor: t.colors.border, padding: 16, gap: 8, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8 }}>
          <View style={{ height: 10, backgroundColor: t.colors.textPrimary, width: "70%" }} />
          <View style={{ height: 6, backgroundColor: t.colors.divider, width: "100%", marginTop: 12 }} />
          <View style={{ height: 6, backgroundColor: t.colors.divider, width: "92%" }} />
          <View style={{ height: 6, backgroundColor: t.colors.divider, width: "85%" }} />
          <View style={{ height: 6, backgroundColor: t.colors.divider, width: "100%", marginTop: 8 }} />
        </View>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={t.type.bodyStrong}>HIPAA_Release_MGH_2026.pdf</Text>
          <Text style={t.type.caption}>2 pages · 84 KB</Text>
        </View>
      </Screen>
    </View>
  );
}
