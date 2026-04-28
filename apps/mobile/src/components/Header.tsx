import { Pressable, Text, View } from "react-native";
import { ArrowLeft, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  title?: string;
  variant?: "back" | "close" | "none";
  onBack?: () => void;
  rightAction?: { label?: string; icon?: React.ReactNode; onPress?: () => void };
};

export function Header({ title, variant = "back", onBack, rightAction }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const renderLeft = () => {
    if (variant === "none") return <View style={{ width: t.dims.iconBox, height: t.dims.iconBox }} />;
    const Icon = variant === "close" ? X : ArrowLeft;
    return (
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        style={{ width: t.dims.iconBox, height: t.dims.iconBox, paddingLeft: 16, justifyContent: "center" }}
      >
        <Icon size={t.dims.icon} color={t.colors.textPrimary} />
      </Pressable>
    );
  };

  const renderRight = () => {
    if (!rightAction) return <View style={{ width: t.dims.iconBox, height: t.dims.iconBox }} />;
    return (
      <Pressable
        onPress={rightAction.onPress}
        accessibilityRole="button"
        style={{ width: t.dims.iconBox, height: t.dims.iconBox, paddingRight: 16, justifyContent: "center", alignItems: "flex-end" }}
      >
        {rightAction.icon ?? (
          <Text style={{ fontSize: 17, color: t.colors.primary, fontWeight: "600" }}>
            {rightAction.label}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <View style={{ backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      <View style={{ height: t.dims.headerH, flexDirection: "row", alignItems: "center" }}>
        {renderLeft()}
        <View style={{ flex: 1, height: t.dims.headerH, justifyContent: "center", alignItems: "center" }}>
          {title ? <Text style={t.type.titleHeader} numberOfLines={1}>{title}</Text> : null}
        </View>
        {renderRight()}
      </View>
    </View>
  );
}
