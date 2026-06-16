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
  // Secure fields (passwords, SSN) must never auto-capitalize or autocorrect.
  // Default both off whenever secureTextEntry is set; callers can still override
  // (e.g. reveal-password fields pass autoCapitalize explicitly so it holds even
  // while the text is temporarily visible).
  const secureDefaults = rest.secureTextEntry
    ? { autoCapitalize: "none" as const, autoCorrect: false }
    : null;
  // E2E only: iOS pops a "Use Strong Password?" AutoFill sheet on secure fields
  // that steals focus and swallows Maestro's typed input. Under the E2E flag
  // (set by the test harness's Metro), suppress AutoFill so flows can type.
  // Production keeps the password-manager UX untouched.
  const e2eSecureOff =
    rest.secureTextEntry && process.env.EXPO_PUBLIC_E2E === "1"
      ? { textContentType: "oneTimeCode" as const, autoComplete: "off" as const }
      : null;
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
          {...secureDefaults}
          {...e2eSecureOff}
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
