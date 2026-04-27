import { Pressable, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Action = {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary";
};

type Props = {
  icon: React.ReactNode;
  iconBg?: string;
  title: string;
  subtitle: string;
  actions?: Action[];
};

export function EmptyState({ icon, iconBg, title, subtitle, actions = [] }: Props) {
  const t = useTheme();
  const circleBg = iconBg ?? t.colors.surfaceSubtle;

  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        paddingHorizontal: 16,
        paddingVertical: 80,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: circleBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </View>

      <View style={{ alignItems: "center", gap: 8, maxWidth: 300 }}>
        <Text style={[t.type.h3, { textAlign: "center" }]}>{title}</Text>
        <Text style={[t.type.caption, { textAlign: "center", lineHeight: 20 }]}>{subtitle}</Text>
      </View>

      {actions.length > 0 ? (
        <View style={{ alignSelf: "stretch", gap: 10 }}>
          {actions.map((a, i) => {
            const isSecondary = a.variant === "secondary";
            const bg = isSecondary ? t.colors.surface : t.colors.primary;
            const fg = isSecondary ? t.colors.textPrimary : "#FFFFFF";
            const borderWidth = isSecondary ? 1 : 0;
            return (
              <Pressable
                key={i}
                onPress={a.onPress}
                style={{
                  height: 52,
                  borderRadius: t.radius.button,
                  backgroundColor: bg,
                  borderWidth,
                  borderColor: t.colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  gap: 8,
                }}
              >
                {a.icon}
                <Text style={{ color: fg, fontWeight: "700", fontSize: 16 }}>{a.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
