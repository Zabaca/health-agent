import { View } from "react-native";

export type StackSegment = { value: number; color: string };

type Props = {
  /** One entry per bar; each bar is a list of stacked segments (bottom → top). */
  bars: StackSegment[][];
  height?: number;
  /** Non-selected bars are slightly dimmed so the latest night reads as current. */
  selectedIndex?: number;
};

/**
 * Stacked bar chart. Bars share BarChart's layout (flex:1 + gap:4 + flex-end) so
 * ChartLabels lines up 1:1 underneath. Each bar's height is the sum of its
 * segment values, scaled to the tallest bar; segments fill that height in
 * proportion to their values (segment[0] at the bottom).
 */
export function StackedBarChart({ bars, height = 120, selectedIndex }: Props) {
  const totals = bars.map((segs) => segs.reduce((s, seg) => s + seg.value, 0));
  const max = Math.max(...totals, 1);
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4, height }}>
      {bars.map((segs, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: (totals[i] / max) * height,
            borderRadius: 6,
            overflow: "hidden",
            flexDirection: "column-reverse",
            opacity: selectedIndex == null || i === selectedIndex ? 1 : 0.9,
          }}
        >
          {segs.map((seg, j) => (
            <View key={j} style={{ flexGrow: seg.value, flexBasis: 0, backgroundColor: seg.color }} />
          ))}
        </View>
      ))}
    </View>
  );
}
