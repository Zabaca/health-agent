import { useState } from "react";
import { Pressable, Text, View, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search, SlidersHorizontal, Upload, FlaskConical, Scan, FileText, ChevronRight } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import { mockRecords, providerChips, type RecordKind } from "@/mock/records";
import type { RecordsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RecordsParamList>;

const iconFor: Record<RecordKind, (color: string) => React.ReactNode> = {
  labs: (c) => <FlaskConical size={20} color={c} />,
  imaging: (c) => <Scan size={20} color={c} />,
  notes: (c) => <FileText size={20} color={c} />,
};

export default function RecordsList() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [activeProvider, setActiveProvider] = useState(0);

  const goToDetail = (id: string, kind: RecordKind) => {
    if (kind === "labs") nav.navigate("RecordDetailLabs", { recordId: id });
    else if (kind === "imaging") nav.navigate("RecordDetailImaging", { recordId: id });
    else nav.navigate("RecordDetailNotes", { recordId: id });
  };

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text
          style={[t.type.h1, { flex: 1 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          My Records
        </Text>
        <Pressable
          onPress={() => nav.navigate("UploadSheet")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: t.colors.primaryBg,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: t.radius.pill,
          }}
        >
          <Upload size={16} color={t.colors.primary} />
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Upload</Text>
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.button,
          borderWidth: 1,
          borderColor: t.colors.border,
          paddingHorizontal: 14,
          height: 44,
        }}
      >
        <Search size={18} color={t.colors.textSecondary} />
        <Text style={[t.type.body, { color: t.colors.textPlaceholder, flex: 1 }]}>Search by file name or type...</Text>
        <Pressable onPress={() => nav.navigate("FilterSheet")}>
          <SlidersHorizontal size={18} color={t.colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {providerChips.map((c, i) => (
          <Pressable key={c} onPress={() => setActiveProvider(i)}>
            <View
              style={{
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: t.radius.pill,
                backgroundColor: i === activeProvider ? t.colors.primary : "transparent",
                borderWidth: 1,
                borderColor: i === activeProvider ? t.colors.primary : t.colors.border,
              }}
            >
              <Text style={{ color: i === activeProvider ? "#FFFFFF" : t.colors.textPrimary, fontSize: 13, fontWeight: "500" }}>{c}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <View style={{ gap: 10 }}>
        {mockRecords.map((r) => {
          const tone = r.kind === "labs" ? t.colors.primary : t.colors.textSecondary;
          const tile = r.kind === "labs" ? t.colors.primaryBg : t.colors.surfaceSubtle;
          return (
            <Pressable key={r.id} onPress={() => goToDetail(r.id, r.kind)}>
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
                    backgroundColor: tile,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {iconFor[r.kind](tone)}
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={t.type.bodyStrong}>{r.title}</Text>
                  <Text style={t.type.caption}>
                    {r.kind === "labs" ? "Labs" : r.kind === "imaging" ? "Imaging" : "Notes"} · {r.date}
                  </Text>
                </View>
                <ChevronRight size={18} color={t.colors.textSecondary} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}
