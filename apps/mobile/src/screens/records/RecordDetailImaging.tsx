import { Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Maximize2, CheckCircle2 } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { mockRecords } from "@/mock/records";
import type { RecordsParamList } from "@/navigation/types";
import { DetailShell, SectionHeader } from "./_DetailShell";

type R = RouteProp<RecordsParamList, "RecordDetailImaging">;
type Nav = NativeStackNavigationProp<RecordsParamList>;

export default function RecordDetailImaging() {
  const t = useTheme();
  const { params } = useRoute<R>();
  const nav = useNavigation<Nav>();
  const record = mockRecords.find((r) => r.id === params.recordId) ?? mockRecords[1];

  return (
    <DetailShell record={record} badgeVariant="muted">
      <Pressable onPress={() => nav.navigate("DocumentViewer", { recordId: record.id })}>
        <View
          style={{
            backgroundColor: "#1F1F1F",
            borderRadius: t.radius.card,
            height: 180,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <Maximize2 size={28} color="#FFFFFF55" />
          <Text style={{ color: "#FFFFFFAA", fontSize: 13 }}>{record.imageLabel}</Text>
        </View>
      </Pressable>
      <SectionHeader>FINDINGS</SectionHeader>
      <View style={{ backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: 14 }}>
        <Text style={t.type.body}>{record.findings}</Text>
      </View>
      <SectionHeader>IMPRESSION</SectionHeader>
      <View
        style={{
          backgroundColor: t.colors.primaryBg,
          borderRadius: t.radius.card,
          padding: 14,
          flexDirection: "row",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <CheckCircle2 size={18} color={t.colors.primary} />
        <Text style={[t.type.body, { flex: 1, color: t.colors.primary }]}>{record.impression}</Text>
      </View>
    </DetailShell>
  );
}
