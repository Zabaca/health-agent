import { Text, View } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { TriangleAlert } from "lucide-react-native";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/theme/ThemeProvider";
import { mockRecords } from "@/mock/records";
import type { RecordsParamList } from "@/navigation/types";
import { DetailShell, SectionHeader } from "./_DetailShell";

type R = RouteProp<RecordsParamList, "RecordDetailLabs">;

export default function RecordDetailLabs() {
  const t = useTheme();
  const { params } = useRoute<R>();
  const record = mockRecords.find((r) => r.id === params.recordId) ?? mockRecords[0];
  const hasAbnormal = record.results?.some((x) => x.status !== "Normal") ?? false;

  return (
    <DetailShell record={record}>
      <SectionHeader>RESULTS</SectionHeader>
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          overflow: "hidden",
        }}
      >
        {record.results?.map((row, i) => (
          <View
            key={row.name}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 14,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: t.colors.divider,
            }}
          >
            <Text style={[t.type.body, { flex: 1 }]}>{row.name}</Text>
            <Text style={{ fontSize: 16, fontWeight: "600", color: row.status === "High" ? t.colors.accent : t.colors.textPrimary, marginRight: 10 }}>{row.value}</Text>
            <Badge label={row.status} variant={row.status === "High" ? "accent" : row.status === "Low" ? "destructive" : "success"} />
          </View>
        ))}
      </View>
      {hasAbnormal ? (
        <View
          style={{
            backgroundColor: "#FFF4EE",
            borderRadius: t.radius.card,
            padding: 14,
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
          }}
        >
          <TriangleAlert size={18} color={t.colors.accent} />
          <Text style={[t.type.caption, { flex: 1, color: t.colors.accent }]}>
            1 value outside normal range. Discuss with your provider.
          </Text>
        </View>
      ) : null}
    </DetailShell>
  );
}
