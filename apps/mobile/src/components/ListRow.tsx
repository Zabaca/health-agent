import { Pressable, Text, View, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  label?: string;
  value?: string;
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  isFirst?: boolean;
};

export function ListRow({
  label,
  value,
  title,
  subtitle,
  right,
  showChevron,
  onPress,
  isFirst,
}: Props) {
  const t = useTheme();
  const Wrap: any = onPress ? Pressable : View;

  return (
    <Wrap
      onPress={onPress}
      style={({ pressed }: { pressed: boolean }) => [
        styles.row,
        {
          minHeight: t.dims.listRowH,
          paddingLeft: 14,
          paddingRight: 14,
          borderTopWidth: isFirst ? 0 : 1,
          borderTopColor: "#E8E8E0",
          backgroundColor: pressed ? t.colors.surfaceSubtle : "transparent",
        },
      ]}
    >
      <View style={{ flex: 1, justifyContent: "center", gap: 2 }}>
        {label ? <Text style={t.type.rowLabel}>{label}</Text> : null}
        {value ? <Text style={t.type.rowValue}>{value}</Text> : null}
        {title ? <Text style={t.type.bodyStrong}>{title}</Text> : null}
        {subtitle ? <Text style={t.type.caption}>{subtitle}</Text> : null}
      </View>
      {right}
      {showChevron ? (
        <ChevronRight size={20} color={t.colors.textSecondary} style={{ marginLeft: 8 }} />
      ) : null}
    </Wrap>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
});
