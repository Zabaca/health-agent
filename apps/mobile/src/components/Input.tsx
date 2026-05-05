import { TextInput, View, Text, type TextInputProps } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = TextInputProps & {
  label?: string;
  helpText?: string;
  error?: string;
  multiline?: boolean;
  required?: boolean;
  rightElement?: React.ReactNode;
};

export function Input({ label, helpText, error, multiline, required, rightElement, style, ...rest }: Props) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
          <Text style={t.type.rowLabel}>{label}</Text>
          {required && <Text style={{ color: t.colors.destructive, fontSize: 12, fontWeight: "600", lineHeight: 16 }}>*</Text>}
        </View>
      ) : null}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: t.colors.surface,
          borderColor: error ? t.colors.destructive : t.colors.border,
          borderWidth: 1,
          borderRadius: t.radius.button,
          minHeight: multiline ? 96 : 48,
        }}
      >
        <TextInput
          placeholderTextColor={t.colors.textPlaceholder}
          multiline={multiline}
          style={[
            {
              flex: 1,
              paddingHorizontal: 14,
              paddingVertical: multiline ? 12 : 14,
              fontSize: 16,
              color: t.colors.textPrimary,
              textAlignVertical: multiline ? "top" : "center",
            },
            style,
          ]}
          {...rest}
        />
        {rightElement ? (
          <View style={{ paddingRight: 12 }}>{rightElement}</View>
        ) : null}
      </View>
      {error ? (
        <Text style={[t.type.caption, { color: t.colors.destructive }]}>{error}</Text>
      ) : helpText ? (
        <Text style={t.type.caption}>{helpText}</Text>
      ) : null}
    </View>
  );
}
