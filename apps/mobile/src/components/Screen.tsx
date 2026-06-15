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
 * optional pinned bottom area for buttons/sheets. Content fills the full
 * width (edge-to-edge minus the gutter) on every device, including iPad.
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
  // ScrollView-only keyboard handling: `automaticallyAdjustKeyboardInsets`
  // (iOS) insets the content by the keyboard height and scrolls the focused
  // input into view, so bottom fields aren't hidden behind the soft keyboard.
  // Defaults below are overridable per-screen via `...rest`.
  const scrollProps = scroll
    ? {
        automaticallyAdjustKeyboardInsets: true,
        keyboardShouldPersistTaps: "handled" as const,
        keyboardDismissMode: "interactive" as const,
      }
    : {};
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
        {...scrollProps}
        {...rest}
      >
        {children}
      </Body>
      {bottom}
    </View>
  );
}
