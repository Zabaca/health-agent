import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Download } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import type { ReleasesParamList } from "@/navigation/types";
import { API_URL, getSessionToken } from "@/lib/api";

type Nav = NativeStackNavigationProp<ReleasesParamList>;
type Route = RouteProp<ReleasesParamList, "ExportPDF">;

export default function ExportPDF() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { releaseId } = route.params;

  const [generating, setGenerating] = useState(false);

  async function handleExport() {
    setGenerating(true);
    try {
      const token = await getSessionToken();
      const res = await fetch(`${API_URL}/api/releases/${releaseId}/print-html`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "text/html",
        },
      });
      if (!res.ok) throw new Error(`Failed to load release (${res.status})`);
      const html = await res.text();

      const { uri } = await Print.printToFileAsync({ html });

      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Sharing unavailable", "Cannot share files on this device.");
        return;
      }
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        UTI: "com.adobe.pdf",
        dialogTitle: "Save or share the release PDF",
      });
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header variant="close" title="Export PDF" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Pressable
              onPress={handleExport}
              disabled={generating}
              style={[
                { height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
                generating && { opacity: 0.7 },
              ]}
            >
              {generating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Download size={16} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Save PDF</Text>
                </>
              )}
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
          <View style={{ height: 6, backgroundColor: t.colors.divider, width: "96%", marginTop: 4 }} />
          <View style={{ height: 6, backgroundColor: t.colors.divider, width: "88%" }} />
        </View>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text style={t.type.bodyStrong}>HIPAA Authorization for Release</Text>
          <Text style={t.type.caption}>Tap below to generate and share the PDF</Text>
        </View>
      </Screen>
    </View>
  );
}
