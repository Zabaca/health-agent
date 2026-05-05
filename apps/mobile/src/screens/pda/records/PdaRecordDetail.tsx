import { Linking, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ExternalLink, FileText } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import type { PdaRecordsParamList } from "@/navigation/types";

type R = RouteProp<PdaRecordsParamList, "PdaRecordDetail">;
type Nav = NativeStackNavigationProp<PdaRecordsParamList>;

export default function PdaRecordDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();

  const title = params.originalName ?? params.fileType.toUpperCase();
  const date = new Date(params.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const rows = [
    { label: "File name", value: params.originalName ?? "—" },
    { label: "Type", value: params.fileType },
    { label: "Source", value: params.source },
    { label: "Date", value: date },
    ...(params.pagecount != null ? [{ label: "Pages", value: String(params.pagecount) }] : []),
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title={title} onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Pressable
              onPress={() => Linking.openURL(params.fileURL)}
              style={{
                height: 52,
                borderRadius: t.radius.button,
                backgroundColor: t.colors.primary,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <ExternalLink size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>View Document</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        <View
          style={{
            backgroundColor: t.colors.primaryBg,
            borderRadius: t.radius.card,
            padding: 24,
            alignItems: "center",
            gap: 10,
          }}
        >
          <FileText size={32} color={t.colors.primary} />
          <Text style={{ color: t.colors.primary, fontWeight: "600", textAlign: "center" }} numberOfLines={2}>
            {title}
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
          {rows.map((row, i) => (
            <View
              key={row.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              <Text style={[t.type.caption, { flex: 1 }]}>{row.label}</Text>
              <Text style={[t.type.body, { fontWeight: "600" }]} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </Screen>
    </View>
  );
}
