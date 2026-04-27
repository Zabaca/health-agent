import { ScrollView, View, type ScrollViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";

type Props = ScrollViewProps & {
  bottom?: React.ReactNode;
  scroll?: boolean;
  noGutter?: boolean;
  /** Pad the top of the content by the device's safe-area top inset. Use on tab-root screens that have no <Header>. */
  safeTop?: boolean;
};

/**
 * Screen body: applies bg, side gutter (24), 20px top padding, and an
 * optional pinned bottom area for buttons/sheets.
 */
export function Screen({
  children,
  bottom,
  scroll = true,
  noGutter,
  safeTop,
  contentContainerStyle,
  style,
  ...rest
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const Body: any = scroll ? ScrollView : View;
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Body
        style={[{ flex: 1 }, style]}
        contentContainerStyle={[
          {
            paddingHorizontal: noGutter ? 0 : t.spacing.gutter,
            paddingTop: t.spacing.topPad + (safeTop ? insets.top : 0),
            paddingBottom: 16,
            gap: t.spacing.gap,
          },
          contentContainerStyle,
        ]}
        {...rest}
      >
        {children}
      </Body>
      {bottom}
    </View>
  );
}
