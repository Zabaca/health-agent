import { TextInput, View, Text, type TextInputProps } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = TextInputProps & {
  label?: string;
  helpText?: string;
  multiline?: boolean;
};

export function Input({ label, helpText, multiline, style, ...rest }: Props) {
  const t = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={t.type.rowLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={t.colors.textPlaceholder}
        multiline={multiline}
        style={[
          {
            backgroundColor: t.colors.surface,
            borderColor: t.colors.border,
            borderWidth: 1,
            borderRadius: t.radius.button,
            paddingHorizontal: 14,
            paddingVertical: multiline ? 12 : 14,
            minHeight: multiline ? 96 : 48,
            fontSize: 16,
            color: t.colors.textPrimary,
            textAlignVertical: multiline ? "top" : "center",
          },
          style,
        ]}
        {...rest}
      />
      {helpText ? <Text style={t.type.caption}>{helpText}</Text> : null}
    </View>
  );
}
