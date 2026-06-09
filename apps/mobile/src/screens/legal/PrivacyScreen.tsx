import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Header } from "@/components/Header";
import { useTheme } from "@/theme/ThemeProvider";
import { LegalDocument } from "./LegalDocument";
import { PRIVACY_POLICY } from "./content";

export default function PrivacyScreen() {
  const t = useTheme();
  const nav = useNavigation();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Privacy Policy" onBack={() => nav.goBack()} />
      <LegalDocument doc={PRIVACY_POLICY} />
    </View>
  );
}
