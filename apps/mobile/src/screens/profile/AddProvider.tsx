import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronDown } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import type { ProvidersParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProvidersParamList>;

export default function AddProvider() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [type] = useState("Hospital / Facility");

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Add Provider" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Button label="Save Provider" onPress={() => nav.goBack()} fullWidth />
          </View>
        }
        contentContainerStyle={{ gap: 12 }}
      >
        <View style={{ gap: 6 }}>
          <Text style={t.type.rowLabel}>PROVIDER TYPE</Text>
          <View
            style={{
              backgroundColor: t.colors.surface,
              borderColor: t.colors.border,
              borderWidth: 1,
              borderRadius: t.radius.button,
              paddingHorizontal: 14,
              height: 48,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={[t.type.body, { flex: 1, fontWeight: "600" }]}>{type}</Text>
            <ChevronDown size={18} color={t.colors.textSecondary} />
          </View>
        </View>

        <Input label="Provider / Hospital Name" placeholder="e.g. Mass General Hospital" />
        <Input label="Physician Name (optional)" placeholder="e.g. Dr. Sarah Chen" />
        <Input label="Phone" placeholder="(617) 555-0100" keyboardType="phone-pad" />
        <Input label="Fax" placeholder="(617) 555-0101" keyboardType="phone-pad" />
        <Input label="Address (optional)" placeholder="123 Main St, Boston, MA 02114" />
        <Input label="Patient / Member ID (optional)" placeholder="Your ID at this provider" />
      </Screen>
    </View>
  );
}
