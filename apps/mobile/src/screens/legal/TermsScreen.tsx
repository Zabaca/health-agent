import { View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Header } from "@/components/Header";
import { useTheme } from "@/theme/ThemeProvider";
import { LegalDocument } from "./LegalDocument";
import { TERMS_OF_SERVICE } from "./content";

export default function TermsScreen() {
  const t = useTheme();
  const nav = useNavigation();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Terms of Service" onBack={() => nav.goBack()} />
      <LegalDocument doc={TERMS_OF_SERVICE} />
    </View>
  );
}
