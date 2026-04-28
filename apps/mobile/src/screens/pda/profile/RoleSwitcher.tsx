import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { representedPatients, findPatient } from "@/mock/pda";
import type { PdaProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaProfileParamList>;

export default function RoleSwitcher() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { representing, switchTo } = useRole();
  const [selected, setSelected] = useState<string | "patient">(representing ?? representedPatients[0].id);

  const apply = () => {
    if (selected === "patient") switchTo("patient");
    else switchTo("pda", selected);
    nav.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}>
      <Pressable style={{ flex: 1 }} onPress={() => nav.goBack()} />
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingTop: 8,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: t.spacing.gutter,
          gap: 16,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ width: 24 }} />
          <Text style={t.type.h3}>Switch Role</Text>
          <Pressable onPress={() => nav.goBack()}>
            <X size={20} color={t.colors.textSecondary} />
          </Pressable>
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
          {representedPatients.map((p, i) => {
            const on = selected === p.id;
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
                  backgroundColor: on ? t.colors.primaryBg : "transparent",
                }}
              >
                <Radio on={on} />
                <View style={{ flex: 1 }}>
                  <Text style={[t.type.bodyStrong, { color: on ? t.colors.primary : t.colors.textPrimary }]}>
                    Representing {p.name}
                  </Text>
                  <Text style={[t.type.caption, { color: on ? t.colors.primary : t.colors.textSecondary }]}>
                    {p.relationship}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => setSelected("patient")}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 14,
              borderTopWidth: 1,
              borderTopColor: t.colors.divider,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: selected === "patient" ? t.colors.primaryBg : "transparent",
            }}
          >
            <Radio on={selected === "patient"} />
            <View style={{ flex: 1 }}>
              <Text style={t.type.bodyStrong}>My Profile</Text>
              <Text style={t.type.caption}>Patient</Text>
            </View>
          </Pressable>
        </View>

        <Button label="Switch Role" onPress={apply} fullWidth />
      </View>
    </View>
  );
}

function Radio({ on }: { on: boolean }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: on ? t.colors.primary : t.colors.borderMuted,
        backgroundColor: on ? t.colors.primary : "transparent",
      }}
    >
      {on ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF", margin: 6 }} /> : null}
    </View>
  );
}
