import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search, Check, Plus } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { ReleasesParamList } from "@/navigation/types";
import { WizardShell } from "./_WizardShell";

type Nav = NativeStackNavigationProp<ReleasesParamList>;

const providers = [
  { id: "p1", name: "Mass General Hospital", physician: "Dr. Sarah Chen · Primary Care" },
  { id: "p2", name: "Beth Israel Deaconess", physician: "Dr. James Park · Cardiology" },
];

export default function WizardStep1() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [selected, setSelected] = useState("p1");

  return (
    <WizardShell step={1} subtitle="Select Provider" primaryLabel="Next →" onPrimary={() => nav.navigate("WizardStep2")}>
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
        <Text style={[t.type.body, { color: t.colors.textPlaceholder, flex: 1 }]}>Search providers...</Text>
      </View>

      <Text style={[t.type.sectionLabel, { textTransform: "uppercase" }]}>SAVED PROVIDERS</Text>

      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          overflow: "hidden",
        }}
      >
        {providers.map((p, i) => {
          const on = p.id === selected;
          return (
            <Pressable
              key={p.id}
              onPress={() => setSelected(p.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={t.type.bodyStrong}>{p.name}</Text>
                <Text style={t.type.caption}>{p.physician}</Text>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 1.5,
                  borderColor: on ? t.colors.primary : t.colors.borderMuted,
                  backgroundColor: on ? t.colors.primary : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {on ? <Check size={14} color="#FFFFFF" /> : null}
              </View>
            </Pressable>
          );
        })}
        <Pressable
          style={{
            paddingHorizontal: 14,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: t.colors.divider,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Plus size={18} color={t.colors.primary} />
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Add a new provider</Text>
        </Pressable>
      </View>
    </WizardShell>
  );
}
