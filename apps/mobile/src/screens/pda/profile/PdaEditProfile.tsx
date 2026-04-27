import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { mockPda } from "@/mock/pda";
import type { PdaProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaProfileParamList>;

export default function PdaEditProfile() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Edit Profile" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Button label="Save Changes" onPress={() => nav.goBack()} fullWidth />
          </View>
        }
        contentContainerStyle={{ gap: 12 }}
      >
        <View style={{ alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 12, marginVertical: 8 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: t.colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 18 }}>{mockPda.initials}</Text>
          </View>
          <Pressable>
            <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Change Photo</Text>
          </Pressable>
        </View>

        <Input label="First Name" defaultValue="Sarah" />
        <Input label="Middle Name" placeholder="Optional" />
        <Input label="Last Name" defaultValue="Johnson" />
        <Input label="Email" defaultValue={mockPda.email} autoCapitalize="none" keyboardType="email-address" />
        <Input label="Phone Number" defaultValue="(617) 555-0234" keyboardType="phone-pad" />
        <Input label="Date of Birth" defaultValue="May 8, 1982" />
        <Input label="Address" defaultValue="42 Beacon St, Boston, MA 02108" />
      </Screen>
    </View>
  );
}
