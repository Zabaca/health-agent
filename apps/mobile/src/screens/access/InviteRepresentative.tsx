import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Send, ChevronDown } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { PermissionPicker } from "@/components/PermissionPicker";
import { useTheme } from "@/theme/ThemeProvider";
import type { AccessParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AccessParamList>;

export default function InviteRepresentative() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [email, setEmail] = useState("");
  const [records, setRecords] = useState<"None" | "Viewer" | "Editor">("Editor");
  const [providers, setProviders] = useState<"None" | "Viewer" | "Editor">("None");
  const [releases, setReleases] = useState<"None" | "Viewer" | "Editor">("None");

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Invite Representative" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Pressable
              onPress={() => nav.goBack()}
              style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
            >
              <Send size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Send Invite</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        <Input label="Email" placeholder="representative@example.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />

        <View style={{ gap: 6 }}>
          <Text style={t.type.rowLabel}>Relationship (optional)</Text>
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
            <Text style={[t.type.body, { color: t.colors.textPlaceholder, flex: 1 }]}>
              e.g. Spouse, Child, Caregiver...
            </Text>
            <ChevronDown size={18} color={t.colors.textSecondary} />
          </View>
        </View>

        <Text style={[t.type.sectionLabel, { textTransform: "uppercase" }]}>PERMISSIONS</Text>

        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.border,
            overflow: "hidden",
          }}
        >
          <PermissionPicker label="Health Records" value={records} onChange={setRecords} isFirst />
          <PermissionPicker label="Manage Providers" value={providers} onChange={setProviders} />
          <PermissionPicker label="HIPAA Release Request" value={releases} onChange={setReleases} />
        </View>
      </Screen>
    </View>
  );
}
