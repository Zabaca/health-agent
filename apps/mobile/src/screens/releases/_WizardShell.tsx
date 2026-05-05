import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, Check } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import type { ReleasesParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ReleasesParamList>;

export function WizardShell({
  step,
  total = 5,
  subtitle,
  primaryLabel,
  primaryDisabled,
  onPrimary,
  children,
}: {
  step: number;
  total?: number;
  subtitle: string;
  primaryLabel: string;
  primaryDisabled?: boolean;
  onPrimary: () => void;
  children: React.ReactNode;
}) {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View
        style={{
          height: 56,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          marginTop: insets.top,
        }}
      >
        <Pressable onPress={() => nav.goBack()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <ChevronLeft size={18} color={t.colors.primary} />
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Back</Text>
        </Pressable>
        <Text style={t.type.titleHeader}>New Release</Text>
        <Pressable onPress={() => nav.popToTop()}>
          <Text style={t.type.caption}>Cancel</Text>
        </Pressable>
      </View>

      <View style={{ alignItems: "center", paddingVertical: 8, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          {Array.from({ length: total }).map((_, i) => {
            const idx = i + 1;
            const done = idx < step;
            const active = idx === step;
            return (
              <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: active ? t.colors.primary : done ? t.colors.primaryBg : t.colors.surfaceSubtle,
                    borderWidth: 1,
                    borderColor: active || done ? t.colors.primary : t.colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {done ? (
                    <Check size={14} color={t.colors.primary} />
                  ) : (
                    <Text style={{ color: active ? "#FFFFFF" : t.colors.textSecondary, fontWeight: "600" }}>{idx}</Text>
                  )}
                </View>
                {idx < total ? <View style={{ width: 14, height: 1, backgroundColor: t.colors.border }} /> : null}
              </View>
            );
          })}
        </View>
        <Text style={t.type.caption}>{`Step ${step} of ${total} — ${subtitle}`}</Text>
      </View>

      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Button label={primaryLabel} onPress={onPrimary} disabled={primaryDisabled} fullWidth />
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        {children}
      </Screen>
    </View>
  );
}
