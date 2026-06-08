import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Switch, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, LogOut } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useOAuthButtons } from "@/hooks/useOAuthButtons";
import { getConnections, unlinkConnection, deleteAccount, ApiError, type Connections } from "@/lib/api";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

export default function AccountSettings() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { user, signOut, bioEnabled, bioSupported, enableBiometric, disableBiometric } = useAuth();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [conn, setConn] = useState<Connections | null>(null);
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const loadConnections = useCallback(() => {
    getConnections().then(setConn).catch(() => {});
  }, []);
  useEffect(() => { loadConnections(); }, [loadConnections]);

  const { onApple, onGoogle, appleAvailable, googleReady, error: linkError, busy: linking } =
    useOAuthButtons({ mode: "link", onLinked: loadConnections });

  const onUnlink = (provider: "apple" | "google", label: string) => {
    Alert.alert(`Unlink ${label}?`, "You can re-link it anytime.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unlink",
        style: "destructive",
        onPress: async () => {
          setUnlinking(provider);
          try {
            await unlinkConnection(provider);
            loadConnections();
          } catch (e) {
            Alert.alert("Couldn't unlink", e instanceof Error ? e.message : "Please try again.");
          } finally {
            setUnlinking(null);
          }
        },
      },
    ]);
  };

  const onBioToggle = async (next: boolean) => {
    if (next) {
      await enableBiometric();
    } else {
      await disableBiometric();
    }
  };

  const onDeleteAccount = async () => {
    setDeleteOpen(false);
    try {
      await deleteAccount();
    } catch (e) {
      Alert.alert(
        "Couldn't delete account",
        e instanceof ApiError ? e.message : "Please try again.",
      );
      return;
    }
    await signOut(); // clears the stored session token + signs out
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Account Settings" onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ gap: 16 }}>
        <Group>
          <Row label="Email" value={conn?.email ?? user?.email ?? ""} />
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

        {/* Connected accounts */}
        <Group>
          {appleAvailable ? (
            <LinkRow
              label="Apple"
              connected={conn?.apple ?? false}
              busy={linking || unlinking === "apple"}
              onLink={onApple}
              onUnlink={() => onUnlink("apple", "Apple")}
            />
          ) : null}
          <LinkRow
            label="Google"
            connected={conn?.google ?? false}
            disabled={!googleReady}
            busy={linking || unlinking === "google"}
            onLink={onGoogle}
            onUnlink={() => onUnlink("google", "Google")}
          />
        </Group>
        {linkError ? (
          <Text style={{ color: t.colors.destructive, paddingHorizontal: 4 }}>{linkError}</Text>
        ) : null}

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
        title="Sign out of Veladon?"
        message="You'll need to sign in again next time you open the app."
        confirmLabel="Sign Out"
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => { setSignOutOpen(false); signOut(); }}
      />

      <ConfirmDrawer
        visible={deleteOpen}
        title="Delete your account?"
        message="This signs you out everywhere and permanently closes your account. Medical records are retained only as long as the law requires, then deleted. This can't be undone."
        confirmLabel="Delete Account"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={onDeleteAccount}
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

function LinkRow({
  label,
  connected,
  busy,
  disabled,
  onLink,
  onUnlink,
}: {
  label: string;
  connected: boolean;
  busy?: boolean;
  disabled?: boolean;
  onLink: () => void;
  onUnlink: () => void;
}) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, borderTopWidth: 0 }}>
      <Text style={[t.type.body, { flex: 1 }]}>
        {label}
        {connected ? <Text style={{ color: t.colors.primary }}>  · Connected</Text> : null}
      </Text>
      {busy ? (
        <ActivityIndicator size="small" color={t.colors.textSecondary} />
      ) : connected ? (
        <Pressable onPress={onUnlink}>
          <Text style={{ color: t.colors.destructive, fontWeight: "600" }}>Unlink</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onLink} disabled={disabled}>
          <Text style={{ color: disabled ? t.colors.textSecondary : t.colors.primary, fontWeight: "600" }}>Link</Text>
        </Pressable>
      )}
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
