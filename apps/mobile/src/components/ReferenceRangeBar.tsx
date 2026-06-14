import { View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

// At least one of low/high is provided:
//  - both  → two-sided range; normal band is the middle ~2/3.
//  - high  → upper limit only ("<130"); normal is the left band up to the limit.
//  - low   → lower limit only (">60"); normal is the right band above the limit.
type Props = { value: number; low: number | null; high: number | null };

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export function ReferenceRangeBar({ value, low, high }: Props) {
  const t = useTheme();

  let bandStart: number;
  let bandEnd: number;
  let pos: number;
  let inRange: boolean;

  if (low != null && high != null) {
    bandStart = 1 / 6;
    bandEnd = 5 / 6;
    const span = high - low;
    const frac = span > 0 ? (value - low) / span : 0.5;
    pos = clamp(bandStart + frac * (bandEnd - bandStart));
    inRange = value >= low && value <= high;
  } else if (high != null) {
    // Limit sits at the band's right edge; values above it spill into the right zone.
    bandStart = 0;
    bandEnd = 0.62;
    pos = clamp((value * bandEnd) / high);
    inRange = value <= high;
  } else if (low != null) {
    // Limit sits at the band's left edge; values below it fall into the left zone.
    bandStart = 0.38;
    bandEnd = 1;
    pos = clamp((value * bandStart) / low);
    inRange = value >= low;
  } else {
    return null;
  }

  const markerColor = inRange ? t.colors.primary : t.colors.accent;

  return (
    <View style={{ height: 12, justifyContent: "center" }}>
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: t.colors.surfaceSubtle,
          overflow: "hidden",
          flexDirection: "row",
        }}
      >
        <View style={{ flex: bandStart }} />
        <View style={{ flex: bandEnd - bandStart, backgroundColor: t.colors.primary20 }} />
        <View style={{ flex: 1 - bandEnd }} />
      </View>
      <View
        style={{
          position: "absolute",
          left: `${pos * 100}%`,
          marginLeft: -5,
          width: 10,
          height: 10,
          borderRadius: 5,
          backgroundColor: markerColor,
          borderWidth: 2,
          borderColor: t.colors.surface,
        }}
      />
    </View>
  );
}
