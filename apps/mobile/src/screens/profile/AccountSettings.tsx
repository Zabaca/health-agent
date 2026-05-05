import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, LogOut } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

export default function AccountSettings() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { user, signOut, bioEnabled, bioSupported, enableBiometric, disableBiometric } = useAuth();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const onBioToggle = async (next: boolean) => {
    if (next) {
      await enableBiometric();
    } else {
      await disableBiometric();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Account Settings" onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ gap: 16 }}>
        <Group>
          <Row label="Email" value={user?.email ?? ""} />
          <Pressable onPress={() => nav.navigate("ChangePassword")}>
            <Row label="Change Password" chevron />
          </Pressable>
          {bioSupported ? (
            <ToggleRow label="Face ID / Touch ID" value={bioEnabled} onChange={onBioToggle} />
          ) : null}
          <Pressable onPress={() => nav.navigate("ActiveDevices")}>
            <Row label="Active Devices" chevron />
          </Pressable>
        </Group>

        <Group>
          <Row label="Privacy Policy" chevron />
          <Row label="Delete Health Data" chevron />
        </Group>

        <Pressable
          onPress={() => setSignOutOpen(true)}
          style={{
            height: 52,
            borderRadius: t.radius.button,
            backgroundColor: t.colors.destructive,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          <LogOut size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Sign Out</Text>
        </Pressable>

        <Pressable onPress={() => setDeleteOpen(true)} style={{ alignItems: "center" }}>
          <Text style={{ color: t.colors.destructive, fontWeight: "600" }}>Delete Account</Text>
        </Pressable>
      </Screen>

      <ConfirmDrawer
        visible={signOutOpen}
        title="Sign out of Zabaca?"
        message="You'll need to sign in again next time you open the app."
        confirmLabel="Sign Out"
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => { setSignOutOpen(false); signOut(); }}
      />

      <ConfirmDrawer
        visible={deleteOpen}
        title="Delete your account?"
        message="This permanently removes your profile, records, releases, and access permissions. This can't be undone."
        confirmLabel="Delete Account"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => { setDeleteOpen(false); signOut(); }}
      />
    </View>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View
      style={{
        backgroundColor: t.colors.surface,
        borderRadius: t.radius.card,
        borderWidth: 1,
        borderColor: t.colors.border,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

function Row({ label, value, chevron }: { label: string; value?: string; chevron?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, borderTopWidth: 0 }}>
      <Text style={[t.type.body, { flex: 1 }]}>{label}</Text>
      {value ? <Text style={t.type.caption}>{value}</Text> : null}
      {chevron ? <ChevronRight size={16} color={t.colors.textSecondary} style={{ marginLeft: 8 }} /> : null}
    </View>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.colors.divider }}>
      <Text style={[t.type.body, { flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: t.colors.borderMuted, true: t.colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}
