import { Pressable, Text, type PressableProps, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export type ButtonVariant = "primary" | "secondary" | "destructive";

type Props = Omit<PressableProps, "children"> & {
  label: string;
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

export function Button({ label, variant = "primary", fullWidth, style, disabled, ...rest }: Props) {
  const t = useTheme();

  const palette = (() => {
    switch (variant) {
      case "secondary":
        return { bg: "transparent", text: t.colors.textPrimary, border: t.colors.textPrimary };
      case "destructive":
        return { bg: t.colors.destructive, text: "#FFFFFF", border: "transparent" };
      case "primary":
      default:
        return { bg: t.colors.primary, text: "#FFFFFF", border: "transparent" };
    }
  })();

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={(state) => [
        styles.base,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === "secondary" ? 1.5 : 0,
          borderRadius: t.radius.button,
          height: t.dims.buttonH,
          width: fullWidth ? "100%" : t.dims.buttonW,
          opacity: disabled ? 0.4 : state.pressed ? 0.85 : 1,
        },
        typeof style === "function" ? style(state) : style,
      ]}
    >
      <Text style={[t.type.button, { color: palette.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Bottom button wrapper — single button (402×68, button 354×52). */
export function BottomButton(props: Props) {
  return (
    <View style={styles.bottomSingle}>
      <Button {...props} />
    </View>
  );
}

/** Bottom button wrapper — two stacked buttons (gap 12). */
export function BottomButtons({ children }: { children: React.ReactNode }) {
  return <View style={styles.bottomTwo}>{children}</View>;
}

const styles = StyleSheet.create({
  base: { alignItems: "center", justifyContent: "center" },
  bottomSingle: {
    height: 68,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomTwo: {
    height: 116,
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
