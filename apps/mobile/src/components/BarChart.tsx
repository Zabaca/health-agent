import { View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  bars: number[];
  selectedIndex?: number;
  selectedColor?: string;
  baseColor?: string;
  height?: number;
};

export function BarChart({ bars, selectedIndex, selectedColor, baseColor, height = 120 }: Props) {
  const t = useTheme();
  const max = Math.max(...bars, 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height }}>
      {bars.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: (v / max) * height,
            borderRadius: 6,
            backgroundColor:
              i === selectedIndex
                ? selectedColor ?? t.colors.primary
                : baseColor ?? t.colors.primary40,
          }}
        />
      ))}
    </View>
  );
}
