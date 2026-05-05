import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import type { PdaProfileParamList } from "@/navigation/types";
import type { RepresentedPatient } from "@/lib/api";

type Nav = NativeStackNavigationProp<PdaProfileParamList>;

function patientName(p: RepresentedPatient) {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.patientId;
}

export default function RoleSwitcher() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { representing, switchTo } = useRole();
  const { patients, loading } = useRepresentedPatients();
  const [selected, setSelected] = useState<string | "patient">(representing ?? patients[0]?.patientId ?? "patient");

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

        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : (
          <View
            style={{
              backgroundColor: t.colors.surface,
              borderRadius: t.radius.card,
              borderWidth: 1,
              borderColor: t.colors.border,
              overflow: "hidden",
            }}
          >
            {patients.map((p, i) => {
              const on = selected === p.patientId;
              return (
                <Pressable
                  key={p.patientId}
                  onPress={() => setSelected(p.patientId)}
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
                      Representing {patientName(p)}
                    </Text>
                    {p.relationship ? (
                      <Text style={[t.type.caption, { color: on ? t.colors.primary : t.colors.textSecondary }]}>
                        {p.relationship}
                      </Text>
                    ) : null}
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
        )}

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
