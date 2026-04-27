import { Text, View } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { useTheme } from "@/theme/ThemeProvider";
import { mockRecords } from "@/mock/records";
import type { RecordsParamList } from "@/navigation/types";
import { DetailShell, SectionHeader } from "./_DetailShell";

type R = RouteProp<RecordsParamList, "RecordDetailNotes">;

export default function RecordDetailNotes() {
  const t = useTheme();
  const { params } = useRoute<R>();
  const record = mockRecords.find((r) => r.id === params.recordId) ?? mockRecords[2];

  return (
    <DetailShell record={record} badgeVariant="accent">
      <SectionHeader>CHIEF COMPLAINT</SectionHeader>
      <View style={{ backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: 14 }}>
        <Text style={t.type.body}>{record.chiefComplaint}</Text>
      </View>
      <SectionHeader>ASSESSMENT &amp; PLAN</SectionHeader>
      <View style={{ backgroundColor: t.colors.surface, borderRadius: t.radius.card, borderWidth: 1, borderColor: t.colors.border, padding: 14, gap: 10 }}>
        {record.assessmentPlan?.map((item, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, marginTop: 8, backgroundColor: t.colors.primary }} />
            <Text style={[t.type.body, { flex: 1 }]}>{item}</Text>
          </View>
        ))}
      </View>
    </DetailShell>
  );
}
