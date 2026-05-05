import { View } from "react-native";
import { Shield, Building2, Activity } from "lucide-react-native";

const TYPE_META: Record<string, { bg: string; iconColor: string }> = {
  Insurance: { bg: "#3D8A5A1A", iconColor: "#3D8A5A" },
  Hospital:  { bg: "#4A78C81A", iconColor: "#4A78C8" },
  Facility:  { bg: "#D8957533", iconColor: "#C07A50" },
};

type Props = {
  type: string;
  size?: number;
};

export function ProviderAvatar({ type, size = 44 }: Props) {
  const meta = TYPE_META[type] ?? TYPE_META.Facility;
  const iconSize = Math.round(size * 0.45);
  const borderRadius = Math.round(size * 0.27);
  const icon =
    type === "Insurance" ? <Shield size={iconSize} color={meta.iconColor} /> :
    type === "Hospital"  ? <Building2 size={iconSize} color={meta.iconColor} /> :
                           <Activity size={iconSize} color={meta.iconColor} />;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundColor: meta.bg,
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {icon}
    </View>
  );
}
