import { StyleSheet, useWindowDimensions, View } from "react-native";
import { BottomTabBar, type BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * On phones the five tabs already fill the width. On wider tablet screens the
 * default bar spreads each item across the full width, leaving big gaps. This
 * keeps a full-width bar surface but clusters the items into a centered,
 * max-width group so they stay visually grouped and tappable.
 */
const MAX_TAB_BAR_WIDTH = 560;

export function CenteredTabBar(props: BottomTabBarProps) {
  const t = useTheme();
  const { width } = useWindowDimensions();

  // Narrow screens (phones): render the default bar unchanged.
  if (width <= MAX_TAB_BAR_WIDTH) return <BottomTabBar {...props} />;

  return (
    <View
      style={{
        backgroundColor: t.colors.surface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: t.colors.border,
        alignItems: "center",
      }}
    >
      <View style={{ width: "100%", maxWidth: MAX_TAB_BAR_WIDTH }}>
        <BottomTabBar {...props} />
      </View>
    </View>
  );
}
