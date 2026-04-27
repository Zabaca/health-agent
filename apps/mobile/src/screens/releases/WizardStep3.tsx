import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { User, Stethoscope, Check, Info } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { ReleasesParamList } from "@/navigation/types";
import { WizardShell } from "./_WizardShell";

type Nav = NativeStackNavigationProp<ReleasesParamList>;

const choices = [
  { id: "self", title: "I'm making the request myself", subtitle: "No representative needed", Icon: User },
  { id: "rep", title: "Dr. Sarah Chen", subtitle: "Your PDA · Mass General Hospital", Icon: Stethoscope },
];

export default function WizardStep3() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [selected, setSelected] = useState("rep");

  return (
    <WizardShell step={3} subtitle="Your Representative" primaryLabel="Next →" onPrimary={() => nav.navigate("WizardStep4")}>
      {choices.map((c) => {
        const on = c.id === selected;
        return (
          <Pressable key={c.id} onPress={() => setSelected(c.id)}>
            <View
              style={{
                backgroundColor: on ? t.colors.primaryBg : t.colors.surface,
                borderRadius: t.radius.card,
                borderWidth: on ? 2 : 1,
                borderColor: on ? t.colors.primary : t.colors.border,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: t.colors.surface,
                  borderWidth: 1,
                  borderColor: t.colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <c.Icon size={20} color={on ? t.colors.primary : t.colors.textSecondary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={t.type.bodyStrong}>{c.title}</Text>
                <Text style={t.type.caption}>{c.subtitle}</Text>
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
            </View>
          </Pressable>
        );
      })}

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
        <Text style={[t.type.caption, { flex: 1, color: t.colors.primary }]}>
          Your representative will be authorized to request records on your behalf.
        </Text>
      </View>
    </WizardShell>
  );
}
