import { useState } from "react";
import { Modal, Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

const DEFAULT_DOB = new Date(2000, 0, 1);

function formatDob(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

type Props = {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
};

/**
 * Labeled date-of-birth picker. Android shows the native dialog directly; iOS
 * shows a spinner inside a Cancel/Done bottom sheet. Mirrors the EditProfile
 * pattern so DOB collection looks identical across signup, consent, and profile.
 */
export function DobField({ value, onChange, label = "DATE OF BIRTH" }: Props) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(DEFAULT_DOB);

  return (
    <View style={{ gap: 6 }}>
      <Text style={t.type.rowLabel}>{label}</Text>
      <Pressable
        onPress={() => {
          setDraft(value ?? DEFAULT_DOB);
          setOpen(true);
        }}
        style={{
          height: 48,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: t.colors.surface,
          borderWidth: 1,
          borderColor: t.colors.border,
          borderRadius: t.radius.button,
        }}
      >
        <Text style={{ flex: 1, fontSize: 16, color: value ? t.colors.textPrimary : t.colors.textPlaceholder }}>
          {value ? formatDob(value) : "Select date"}
        </Text>
        <Calendar size={18} color={t.colors.textSecondary} />
      </Pressable>

      {open && Platform.OS === "android" ? (
        <DateTimePicker
          value={draft}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={(e: DateTimePickerEvent, date?: Date) => {
            setOpen(false);
            if (e.type === "set" && date) onChange(date);
          }}
        />
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
            onPress={() => setOpen(false)}
          >
            <Pressable onPress={() => { /* swallow inner taps */ }}>
              <View style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: t.spacing.gutter, paddingTop: 16, paddingBottom: 8 }}>
                  <Pressable onPress={() => setOpen(false)}>
                    <Text style={{ color: t.colors.textSecondary, fontSize: 15 }}>Cancel</Text>
                  </Pressable>
                  <Text style={t.type.bodyStrong}>Date of Birth</Text>
                  <Pressable onPress={() => { onChange(draft); setOpen(false); }}>
                    <Text style={{ color: t.colors.primary, fontSize: 15, fontWeight: "600" }}>Done</Text>
                  </Pressable>
                </View>
                <DateTimePicker
                  value={draft}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={(_: DateTimePickerEvent, date?: Date) => { if (date) setDraft(date); }}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
