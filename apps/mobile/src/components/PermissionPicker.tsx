import { Pressable, Text, View } from "react-native";
import { Info, Check } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

const opts = ["None", "Viewer", "Editor"] as const;

type Props = {
  label: string;
  value: typeof opts[number];
  onChange: (v: typeof opts[number]) => void;
  isFirst?: boolean;
};

export function PermissionPicker({ label, value, onChange, isFirst }: Props) {
  const t = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: t.colors.divider,
        gap: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={t.type.bodyStrong}>{label}</Text>
        <Info size={14} color={t.colors.textSecondary} />
      </View>
      <View style={{ flexDirection: "row", gap: 18 }}>
        {opts.map((o) => {
          const on = o === value;
          return (
            <Pressable key={o} onPress={() => onChange(o)} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  borderWidth: 1.5,
                  borderColor: on ? t.colors.primary : t.colors.borderMuted,
                  backgroundColor: on ? t.colors.primary : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {on ? <Check size={11} color="#FFFFFF" /> : null}
              </View>
              <Text style={[t.type.body, { fontWeight: on ? "600" : "400" }]}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
