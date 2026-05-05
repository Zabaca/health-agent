import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar, Info } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { ReleasesParamList } from "@/navigation/types";
import { WizardShell } from "./_WizardShell";
import { useWizard } from "./_WizardContext";

type Nav = NativeStackNavigationProp<ReleasesParamList>;

const DURATION_LABELS: Record<string, string> = {
  "90": "90 days",
  "6m": "6 months",
  "1y": "1 year",
  "custom": "Custom",
};

const OPTIONS = [
  { id: "90", label: "90", unit: "days" },
  { id: "6m", label: "6", unit: "months" },
  { id: "1y", label: "1", unit: "year" },
  { id: "custom", label: "", unit: "Custom" },
] as const;

const today = new Date();
today.setHours(0, 0, 0, 0);

function addDays(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}

function addYear(d: Date) {
  return new Date(d.getFullYear() + 1, d.getMonth(), d.getDate());
}

function computeExpiry(id: string, customDate: Date | null): Date | null {
  if (id === "90") return addDays(today, 90);
  if (id === "6m") return addMonths(today, 6);
  if (id === "1y") return addYear(today);
  if (id === "custom") return customDate;
  return null;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function WizardStep4() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { wizard, setWizard } = useWizard();
  const [selected, setSelected] = useState<string>("90");
  const [customDate, setCustomDate] = useState<Date>(addDays(today, 90));
  const [showPicker, setShowPicker] = useState(false);

  const expiry = computeExpiry(selected, customDate);

  function handleOption(id: string) {
    setSelected(id);
    if (id === "custom") {
      setShowPicker(true);
    } else {
      setShowPicker(false);
    }
  }

  const handleNext = () => {
    setWizard(prev => ({
      ...prev,
      expiryDate: expiry,
      durationLabel: DURATION_LABELS[selected] ?? "",
    }));
    nav.navigate("WizardStep5");
  };

  return (
    <WizardShell step={4} subtitle="Release Duration" primaryLabel="Review & Sign →" onPrimary={handleNext}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        {OPTIONS.map((o) => {
          const on = o.id === selected;
          const isCustom = o.id === "custom";
          return (
            <Pressable
              key={o.id}
              onPress={() => handleOption(o.id)}
              style={{
                flex: 1,
                aspectRatio: 1,
                borderRadius: t.radius.card,
                backgroundColor: on ? t.colors.primary : t.colors.surface,
                borderWidth: 1,
                borderColor: on ? t.colors.primary : t.colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {isCustom ? (
                <Calendar size={20} color={on ? "#FFFFFF" : t.colors.textSecondary} />
              ) : (
                <Text style={[t.type.h2, { color: on ? "#FFFFFF" : t.colors.textPrimary }]}>{o.label}</Text>
              )}
              <Text style={{ color: on ? "#FFFFFF" : t.colors.textSecondary, fontSize: 12 }}>{o.unit}</Text>
            </Pressable>
          );
        })}
      </View>

      {selected === "custom" && (
        <DateTimePicker
          value={customDate}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          minimumDate={addDays(today, 90)}
          onChange={(_, date) => {
            if (date) {
              setCustomDate(date);
            }
          }}
          themeVariant="light"
          accentColor={t.colors.primary}
          style={{ marginHorizontal: -8 }}
        />
      )}

      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Calendar size={18} color={t.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={t.type.caption}>Expires on</Text>
          <Text style={t.type.bodyStrong}>
            {expiry ? formatDate(expiry) : "Pick a date"}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: t.colors.primaryBg,
          borderRadius: t.radius.card,
          padding: 14,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
        }}
      >
        <Info size={16} color={t.colors.primary} />
        <Text style={[t.type.caption, { flex: 1, color: t.colors.primary }]}>
          The release will automatically expire after this period. You can revoke it earlier at any time.
        </Text>
      </View>
    </WizardShell>
  );
}
