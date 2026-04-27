import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Building2, Phone, Pencil, Printer, X, AlertTriangle } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useTheme } from "@/theme/ThemeProvider";
import type { ReleasesParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ReleasesParamList>;

export default function FaxDialog() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [coverPage, setCoverPage] = useState(true);
  const [fax, setFax] = useState("(617) 726-5800");

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header variant="close" title="Fax Request" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16, gap: 10 }}>
            <Pressable
              onPress={() => nav.goBack()}
              style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
            >
              <Printer size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Send Fax</Text>
            </Pressable>
            <Button label="Cancel" variant="secondary" onPress={() => nav.goBack()} fullWidth />
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.border,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: t.colors.primaryBg, alignItems: "center", justifyContent: "center" }}>
            <Building2 size={20} color={t.colors.primary} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={t.type.bodyStrong}>Mass General Hospital</Text>
            <Text style={t.type.caption}>Dept. of Health Records</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <Phone size={12} color={t.colors.primary} />
              <Text style={{ color: t.colors.primary, fontWeight: "600" }}>{fax}</Text>
              <Pencil size={12} color={t.colors.primary} />
            </View>
          </View>
        </View>

        <Input label="FAX NUMBER" value={fax} onChangeText={setFax} keyboardType="phone-pad" />

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
          <View style={{ flex: 1 }}>
            <Text style={t.type.bodyStrong}>Include cover page</Text>
            <Text style={t.type.caption}>Adds patient name, date, and release ID</Text>
          </View>
          <Switch
            value={coverPage}
            onValueChange={setCoverPage}
            trackColor={{ false: t.colors.borderMuted, true: t.colors.primary }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View
          style={{
            backgroundColor: "#FFF4EE",
            borderRadius: t.radius.card,
            padding: 14,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <AlertTriangle size={16} color={t.colors.accent} />
          <Text style={[t.type.caption, { color: t.colors.accent, flex: 1 }]}>
            You will not receive a read confirmation. Contact the provider to confirm receipt.
          </Text>
        </View>
      </Screen>
    </View>
  );
}
