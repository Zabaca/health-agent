import { View, Text } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  labels: string[];
  selectedIndex: number;
};

/**
 * X-axis labels aligned 1:1 under BarChart bars (same flex:1 + gap:4 layout).
 * When there are too many labels to fit (e.g. 30 days in the Month view) it
 * keeps every slot for alignment but only draws text at evenly spaced ticks,
 * plus the selected bar, so labels never overlap.
 *
 * Each visible label is rendered absolutely-positioned with a little horizontal
 * overflow (left/right: -16) so multi-digit values like "15" or "30" center over
 * their bar and spill into the adjacent empty slots instead of truncating to "1.".
 */
export function ChartLabels({ labels, selectedIndex }: Props) {
  const t = useTheme();
  const n = labels.length;
  const step = n <= 14 ? 1 : Math.ceil(n / 6);
  return (
    <View style={{ flexDirection: "row", gap: 4, paddingTop: 4, height: 21 }}>
      {labels.map((d, i) => {
        const show = i % step === 0 || i === selectedIndex;
        return (
          <View key={`${d}-${i}`} style={{ flex: 1 }}>
            {show ? (
              <Text
                numberOfLines={1}
                style={[
                  t.type.caption,
                  {
                    position: "absolute",
                    left: -16,
                    right: -16,
                    textAlign: "center",
                    fontWeight: i === selectedIndex ? "600" : "400",
                  },
                ]}
              >
                {d}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
