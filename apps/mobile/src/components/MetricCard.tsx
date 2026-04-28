import { Pressable, Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  label: string;
  value: string;
  unit?: string;
  status?: string;
  statusTone?: "good" | "warn" | "bad";
  onPress?: () => void;
  compact?: boolean;
};

export function MetricCard({ label, value, unit, status, statusTone = "good", onPress, compact }: Props) {
  const t = useTheme();
  const toneColor = statusTone === "warn" ? t.colors.accent : statusTone === "bad" ? t.colors.destructive : t.colors.primary;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        backgroundColor: t.colors.surface,
        borderRadius: t.radius.card,
        borderWidth: 1,
        borderColor: t.colors.border,
        padding: compact ? 12 : 14,
        gap: 6,
      }}
    >
      <Text style={[t.type.sectionLabel, { color: t.colors.textSecondary }]}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        <Text style={compact ? t.type.h3 : t.type.h2}>{value}</Text>
        {unit ? <Text style={t.type.caption}>{unit}</Text> : null}
      </View>
      {status ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: toneColor }} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: toneColor }}>{status}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
