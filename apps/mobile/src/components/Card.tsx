import { View, type ViewProps } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = ViewProps & { padded?: boolean; surface?: "white" | "subtle" };

export function Card({ padded = true, surface = "white", style, children, ...rest }: Props) {
  const t = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: surface === "white" ? t.colors.surface : t.colors.surfaceSubtle,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: padded ? 16 : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
