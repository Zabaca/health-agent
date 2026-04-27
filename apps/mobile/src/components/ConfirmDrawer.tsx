import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  /** Visual tone for the confirm button. */
  tone?: "destructive" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDrawer({
  visible,
  title,
  message,
  confirmLabel,
  tone = "destructive",
  onConfirm,
  onCancel,
}: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const confirmColor = tone === "destructive" ? t.colors.destructive : t.colors.primary;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable
        onPress={onCancel}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: t.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 8,
            paddingBottom: insets.bottom + 16,
            paddingHorizontal: t.spacing.gutter,
            gap: 16,
          }}
        >
          <View style={{ alignItems: "center" }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
          </View>

          <View style={{ gap: 8, paddingTop: 8 }}>
            <Text style={[t.type.h3, { textAlign: "center" }]}>{title}</Text>
            {message ? (
              <Text style={[t.type.body, { color: t.colors.textSecondary, textAlign: "center" }]}>
                {message}
              </Text>
            ) : null}
          </View>

          <View style={{ gap: 10 }}>
            <Pressable
              onPress={onConfirm}
              style={{
                height: 52,
                borderRadius: t.radius.button,
                backgroundColor: confirmColor,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>{confirmLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onCancel}
              style={{
                height: 52,
                borderRadius: t.radius.button,
                backgroundColor: t.colors.surfaceSubtle,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: t.colors.textPrimary, fontWeight: "600", fontSize: 16 }}>Cancel</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
