import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { providerChips } from "@/mock/records";
import type { RecordsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RecordsParamList>;

export default function FilterSheet() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [active, setActive] = useState<number[]>([0]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <View style={{ alignItems: "center", paddingTop: 8 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: t.spacing.gutter, paddingTop: 16 }}>
        <Text style={t.type.h3}>Filter Records</Text>
        <Pressable onPress={() => setActive([])}>
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Clear all</Text>
        </Pressable>
      </View>

      <Text style={[t.type.sectionLabel, { textTransform: "uppercase", paddingHorizontal: t.spacing.gutter, paddingTop: 18 }]}>DATE RANGE</Text>
      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: t.spacing.gutter, paddingTop: 8 }}>
        {[
          { label: "FROM", value: "Jan 1, 2026" },
          { label: "TO", value: "Today" },
        ].map((d) => (
          <View key={d.label} style={{ flex: 1, padding: 10, borderRadius: t.radius.button, borderWidth: 1, borderColor: t.colors.border, backgroundColor: t.colors.surfaceSubtle }}>
            <Text style={t.type.rowLabel}>{d.label}</Text>
            <Text style={[t.type.body, { color: t.colors.primary, fontWeight: "600" }]}>{d.value}</Text>
          </View>
        ))}
      </View>

      <Text style={[t.type.sectionLabel, { textTransform: "uppercase", paddingHorizontal: t.spacing.gutter, paddingTop: 18 }]}>MY PROVIDERS</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: t.spacing.gutter, paddingTop: 8 }}>
        {providerChips.map((p, i) => {
          const on = active.includes(i);
          return (
            <Pressable key={p} onPress={() => setActive((a) => on ? a.filter((x) => x !== i) : [...a, i])}>
              <View
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: t.radius.pill,
                  backgroundColor: on ? t.colors.primary : "transparent",
                  borderWidth: 1,
                  borderColor: on ? t.colors.primary : t.colors.border,
                }}
              >
                <Text style={{ color: on ? "#FFFFFF" : t.colors.textPrimary, fontSize: 13, fontWeight: "500" }}>{p}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
        <View style={{ flex: 1 }}>
          <Button label="Reset" variant="secondary" onPress={() => setActive([])} fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Apply Filters" onPress={() => nav.goBack()} fullWidth />
        </View>
      </View>
    </View>
  );
}
