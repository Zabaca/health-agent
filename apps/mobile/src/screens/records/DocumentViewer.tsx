import { Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Share2, ZoomOut, ZoomIn } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { mockRecords } from "@/mock/records";
import type { RecordsParamList } from "@/navigation/types";

type R = RouteProp<RecordsParamList, "DocumentViewer">;

export default function DocumentViewer() {
  const t = useTheme();
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<R>();
  const record = mockRecords.find((r) => r.id === params.recordId) ?? mockRecords[2];

  return (
    <View style={{ flex: 1, backgroundColor: "#1F1F1F" }}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", minHeight: 64 }}>
        <Pressable onPress={() => nav.goBack()} style={{ width: 40, height: 40, justifyContent: "center" }}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}>{record.title}.pdf</Text>
          <Text style={{ color: "#FFFFFF99", fontSize: 12 }}>{record.date} · {record.kind === "labs" ? "Labs" : record.kind === "imaging" ? "Imaging" : "Notes"}</Text>
        </View>
        <Pressable style={{ width: 40, height: 40, justifyContent: "center", alignItems: "flex-end" }}>
          <Share2 size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        <View style={{ width: "100%", aspectRatio: 0.7, backgroundColor: "#FFFFFF", borderRadius: 6, padding: 16, gap: 8 }}>
          <View style={{ height: 10, backgroundColor: "#1F1F1F", width: "60%" }} />
          <View style={{ height: 6, backgroundColor: "#E5E5E5", width: "100%", marginTop: 12 }} />
          <View style={{ height: 6, backgroundColor: "#E5E5E5", width: "92%" }} />
          <View style={{ height: 6, backgroundColor: "#E5E5E5", width: "85%" }} />
          <View style={{ height: 6, backgroundColor: "#E5E5E5", width: "100%", marginTop: 12 }} />
          <View style={{ height: 6, backgroundColor: "#E5E5E5", width: "80%" }} />
        </View>
      </View>

      <View style={{ height: 64, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 32 }}>
        <Pressable><ZoomOut size={22} color="#FFFFFF" /></Pressable>
        <Text style={{ color: "#FFFFFF", fontSize: 14 }}>Page 1 of 3</Text>
        <Pressable><ZoomIn size={22} color="#FFFFFF" /></Pressable>
      </View>
    </View>
  );
}
