import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, X, Check } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import type { PdaReleasesParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

export function PdaWizardShell({
  step,
  total = 4,
  subtitle,
  primaryLabel,
  onPrimary,
  variant = "back",
  children,
}: {
  step: number;
  total?: number;
  subtitle: string;
  primaryLabel: string;
  onPrimary: () => void;
  variant?: "back" | "close";
  children: React.ReactNode;
}) {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const Icon = variant === "close" ? X : ArrowLeft;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ paddingTop: insets.top, height: 56 + insets.top, flexDirection: "row", alignItems: "center" }}>
        <Pressable onPress={() => nav.goBack()} style={{ width: 56, height: 56, paddingLeft: 16, justifyContent: "center" }}>
          <Icon size={24} color={t.colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={t.type.titleHeader}>New Release</Text>
        </View>
        <View style={{ width: 56 }} />
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
            <Button label={primaryLabel} onPress={onPrimary} fullWidth />
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        {children}
      </Screen>
    </View>
  );
}
