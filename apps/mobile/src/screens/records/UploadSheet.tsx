import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera, Image as ImageIcon, Folder, ChevronRight } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { RecordsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RecordsParamList>;

const sources = [
  { id: "camera", label: "Take Photo", icon: Camera, tile: "primaryBg" as const, fg: "primary" as const },
  { id: "library", label: "Photo Library", icon: ImageIcon, tile: "surfaceSubtle" as const, fg: "textSecondary" as const },
  { id: "files", label: "Browse Files", icon: Folder, tile: "destructiveBg" as const, fg: "accent" as const },
];

const types = ["Labs", "Imaging", "Notes", "Other"];

export default function UploadSheet() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [type, setType] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <View style={{ alignItems: "center", paddingTop: 8 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
      </View>
      <Text style={[t.type.h3, { textAlign: "center", marginTop: 16, marginBottom: 12 }]}>Upload Record</Text>
      <View>
        {sources.map((s, i) => {
          const Icon = s.icon;
          const tileColor = (t.colors as any)[s.tile];
          const fgColor = (t.colors as any)[s.fg];
          return (
            <Pressable
              key={s.id}
              onPress={() => nav.goBack()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: t.spacing.gutter,
                paddingVertical: 14,
                gap: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: tileColor, alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={fgColor} />
              </View>
              <Text style={[t.type.body, { flex: 1 }]}>{s.label}</Text>
              <ChevronRight size={18} color={t.colors.textSecondary} />
            </Pressable>
          );
        })}
      </View>
      <Text style={[t.type.sectionLabel, { textTransform: "uppercase", paddingHorizontal: t.spacing.gutter, paddingTop: 16 }]}>RECORD TYPE</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: t.spacing.gutter, paddingTop: 8 }}>
        {types.map((label, i) => (
          <Pressable key={label} onPress={() => setType(i)}>
            <View
              style={{
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: t.radius.pill,
                backgroundColor: i === type ? t.colors.primary : "transparent",
                borderWidth: 1,
                borderColor: i === type ? t.colors.primary : t.colors.border,
              }}
            >
              <Text style={{ color: i === type ? "#FFFFFF" : t.colors.textPrimary, fontSize: 13, fontWeight: "500" }}>{label}</Text>
            </View>
          </Pressable>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      <Pressable onPress={() => nav.goBack()} style={{ padding: 16, alignItems: "center" }}>
        <Text style={{ color: t.colors.accent, fontWeight: "600", fontSize: 16 }}>Cancel</Text>
      </Pressable>
    </View>
  );
}
