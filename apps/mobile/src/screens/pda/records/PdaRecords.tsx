import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Upload, ChevronRight, FlaskConical, Scan, FileText } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import { mockRecords, type RecordKind } from "@/mock/records";
import type { PdaRecordsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaRecordsParamList>;

const iconFor: Record<RecordKind, (color: string) => React.ReactNode> = {
  labs: (c) => <FlaskConical size={20} color={c} />,
  imaging: (c) => <Scan size={20} color={c} />,
  notes: (c) => <FileText size={20} color={c} />,
};

const labelFor: Record<RecordKind, string> = {
  labs: "Labs",
  imaging: "Imaging",
  notes: "Notes",
};

export default function PdaRecords() {
  const t = useTheme();
  const nav = useNavigation<Nav>();

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[t.type.h1, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          Health Records
        </Text>
        <Pressable hitSlop={8}>
          <Upload size={22} color={t.colors.primary} />
        </Pressable>
      </View>

      {mockRecords.map((r) => (
        <Pressable key={r.id} onPress={() => nav.navigate("PdaRecordDetail", { recordId: r.id })}>
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
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: t.colors.primaryBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {iconFor[r.kind](t.colors.primary)}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={t.type.bodyStrong}>{r.title}</Text>
              <Text style={t.type.caption}>{labelFor[r.kind]} · {r.date}</Text>
            </View>
            <ChevronRight size={16} color={t.colors.textSecondary} />
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
