import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, Bell, ShieldCheck, Repeat, LogOut, User } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { mockPda, findPatient } from "@/mock/pda";
import type { PdaProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaProfileParamList>;

export default function PdaProfile() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { signOut } = useAuth();
  const { representing } = useRole();
  const patient = findPatient(representing);
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header
        title="My Profile"
        variant="none"
        rightAction={{ label: "Edit", onPress: () => nav.navigate("PdaEditProfile") }}
      />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Pressable
              onPress={() => setSignOutOpen(true)}
              style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.destructive, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
            >
              <LogOut size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Sign Out</Text>
            </Pressable>
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
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.primaryBg, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: t.colors.primary, fontWeight: "700" }}>{mockPda.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={t.type.bodyStrong}>{mockPda.name}</Text>
            <Text style={t.type.caption}>{mockPda.email}</Text>
          </View>
          <Badge label="PDA" variant="success" />
        </View>

        <View>
          <Text style={[t.type.sectionLabel, { textTransform: "uppercase", marginBottom: 8 }]}>REPRESENTING</Text>
          <Pressable onPress={() => nav.navigate("PdaPeopleIRepresent")}>
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
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: t.colors.primaryBg, alignItems: "center", justifyContent: "center" }}>
                <User size={18} color={t.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={t.type.bodyStrong}>{patient.name}</Text>
                <Text style={t.type.caption}>{patient.relationship} · Since {patient.startedOn}</Text>
              </View>
              <Badge label="Active" variant="success" />
            </View>
          </Pressable>
        </View>

        <View>
          <Text style={[t.type.sectionLabel, { textTransform: "uppercase", marginBottom: 8 }]}>ACCOUNT</Text>
          <View
            style={{
              backgroundColor: t.colors.surface,
              borderRadius: t.radius.card,
              borderWidth: 1,
              borderColor: t.colors.border,
              overflow: "hidden",
            }}
          >
            <Row icon={<Bell size={18} color={t.colors.textSecondary} />} label="Notifications" />
            <Row icon={<ShieldCheck size={18} color={t.colors.textSecondary} />} label="Privacy & Security" />
            <Row
              icon={<Repeat size={18} color={t.colors.primary} />}
              label="Switch to Patient View"
              tint="primary"
              onPress={() => nav.navigate("RoleSwitcher")}
            />
          </View>
        </View>
      </Screen>

      <ConfirmDrawer
        visible={signOutOpen}
        title="Sign out of Zabaca?"
        message="You'll need to sign in again next time you open the app."
        confirmLabel="Sign Out"
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => { setSignOutOpen(false); signOut(); }}
      />
    </View>
  );
}

function Row({
  icon,
  label,
  tint,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  tint?: "primary";
  onPress?: () => void;
}) {
  const t = useTheme();
  const color = tint === "primary" ? t.colors.primary : t.colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderTopWidth: 0,
      }}
    >
      {icon}
      <Text style={[t.type.body, { flex: 1, color }]}>{label}</Text>
      <ChevronRight size={16} color={t.colors.textSecondary} />
    </Pressable>
  );
}
