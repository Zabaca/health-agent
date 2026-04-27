import { Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";

export function SectionLabel({ children }: { children: string }) {
  const t = useTheme();
  return (
    <View style={{ paddingHorizontal: 4, paddingBottom: 8 }}>
      <Text style={[t.type.sectionLabel, { textTransform: "uppercase" }]}>{children}</Text>
    </View>
  );
}
