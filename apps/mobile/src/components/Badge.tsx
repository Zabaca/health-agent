import { Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Variant = "success" | "muted" | "destructive" | "accent";

export function Badge({ label, variant = "muted" }: { label: string; variant?: Variant }) {
  const t = useTheme();
  const palette = (() => {
    switch (variant) {
      case "success":
        return { bg: t.colors.primaryBg, fg: t.colors.primary };
      case "destructive":
        return { bg: t.colors.destructiveBg, fg: t.colors.destructive };
      case "accent":
        return { bg: t.colors.accent20, fg: t.colors.accent };
      case "muted":
      default:
        return { bg: t.colors.surfaceSubtle, fg: t.colors.textSecondary };
    }
  })();
  return (
    <View
      style={{
        alignSelf: "flex-start",
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: palette.bg,
        borderRadius: t.radius.pill,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color: palette.fg }}>{label}</Text>
    </View>
  );
}
