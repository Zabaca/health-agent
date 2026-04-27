import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar, Info } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { PdaReleasesParamList } from "@/navigation/types";
import { PdaWizardShell } from "./_PdaWizardShell";

type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

const options = [
  { id: "30", value: "30", unit: "days" },
  { id: "90", value: "90", unit: "days" },
  { id: "1y", value: "1", unit: "year" },
  { id: "custom", value: "Custom", unit: "" },
];

export default function PdaWizardStep3() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [duration, setDuration] = useState("90");

  return (
    <PdaWizardShell
      step={3}
      subtitle="Release Duration"
      primaryLabel="Next — Review & Submit"
      onPrimary={() => nav.navigate("PdaWizardStep4")}
    >
      <View style={{ flexDirection: "row", gap: 10 }}>
        {options.map((o) => {
          const on = o.id === duration;
          const isCustom = o.id === "custom";
          return (
            <Pressable
              key={o.id}
              onPress={() => setDuration(o.id)}
              style={{
                flex: 1,
                aspectRatio: 1,
                borderRadius: t.radius.card,
                backgroundColor: on ? t.colors.primary : t.colors.surface,
                borderWidth: 1,
                borderColor: on ? t.colors.primary : t.colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isCustom ? (
                <Calendar size={20} color={on ? "#FFFFFF" : t.colors.textSecondary} />
              ) : (
                <Text style={[t.type.h2, { color: on ? "#FFFFFF" : t.colors.textPrimary }]}>{o.value}</Text>
              )}
              <Text style={{ color: on ? "#FFFFFF" : t.colors.textSecondary, fontSize: 12 }}>{o.unit || "Custom"}</Text>
            </Pressable>
          );
        })}
      </View>

      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Calendar size={18} color={t.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={t.type.caption}>Expires on</Text>
          <Text style={t.type.bodyStrong}>Oct 15, 2026</Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: t.colors.primaryBg,
          borderRadius: t.radius.card,
          padding: 14,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <Info size={16} color={t.colors.primary} />
        <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
          The release will automatically expire after this period. You can revoke it earlier at any time.
        </Text>
      </View>
    </PdaWizardShell>
  );
}
