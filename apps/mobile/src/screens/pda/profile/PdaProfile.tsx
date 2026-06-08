import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, Bell, ShieldCheck, Repeat, Monitor, LogOut, UserRound } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { AuthenticatedImage } from "@/components/AuthenticatedImage";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import { getProfile, type ProfileData } from "@/lib/api";
import type { PdaProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaProfileParamList>;

function fullName(p: ProfileData | null) {
  if (!p) return "";
  return `${p.firstName} ${p.lastName}`.trim();
}

function initials(p: ProfileData | null) {
  if (!p) return "";
  return `${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`.toUpperCase();
}

export default function PdaProfile() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { signOut, user } = useAuth();
  const { switchTo } = useRole();
  const { currentPatient } = useRepresentedPatients();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);

  useEffect(() => {
    getProfile().then(setProfile).catch(() => {});
  }, []);

  const patientName = currentPatient
    ? `${currentPatient.firstName ?? ""} ${currentPatient.lastName ?? ""}`.trim() || currentPatient.patientId
    : "";

  return (
    <Screen
      safeTop
      bottom={
        <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
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
        </View>
      }
      contentContainerStyle={{ gap: 16 }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[t.type.h1, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          My Profile
        </Text>
        <Pressable hitSlop={8} onPress={() => nav.navigate("PdaEditProfile")}>
          <Text style={{ color: t.colors.primary, fontWeight: "600", fontSize: 16 }}>Edit</Text>
        </Pressable>
      </View>

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
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: t.colors.primaryBg,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {profile?.avatarUrl ? (
            <AuthenticatedImage uri={profile.avatarUrl} style={{ width: 44, height: 44 }} resizeMode="cover" />
          ) : initials(profile) ? (
            <Text style={{ color: t.colors.primary, fontWeight: "700" }}>{initials(profile)}</Text>
          ) : (
            <UserRound size={22} color={t.colors.primary} />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={t.type.bodyStrong}>{fullName(profile) || (user?.email ?? "")}</Text>
          <Text style={t.type.caption}>{user?.email ?? ""}</Text>
        </View>
        <Badge label="You" variant="success" />
      </View>

      {currentPatient ? (
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
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: t.colors.primaryBg,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {currentPatient.avatarUrl ? (
                  <AuthenticatedImage uri={currentPatient.avatarUrl} style={{ width: 36, height: 36 }} resizeMode="cover" />
                ) : (currentPatient.firstName || currentPatient.lastName) ? (
                  <Text style={{ color: t.colors.primary, fontWeight: "700", fontSize: 13 }}>
                    {`${currentPatient.firstName?.[0] ?? ""}${currentPatient.lastName?.[0] ?? ""}`.toUpperCase()}
                  </Text>
                ) : (
                  <UserRound size={18} color={t.colors.primary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={t.type.bodyStrong}>{patientName}</Text>
                {currentPatient.relationship ? (
                  <Text style={t.type.caption}>{currentPatient.relationship}</Text>
                ) : null}
              </View>
              <Badge label="Active" variant="success" />
            </View>
          </Pressable>
        </View>
      ) : null}

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
            icon={<Monitor size={18} color={t.colors.textSecondary} />}
            label="Active Devices"
            onPress={() => nav.navigate("ActiveDevices")}
          />
          <Row
            icon={<Repeat size={18} color={t.colors.primary} />}
            label="Switch to Patient View"
            tint="primary"
            onPress={() => switchTo("patient")}
          />
        </View>
      </View>

      <ConfirmDrawer
        visible={signOutOpen}
        title="Sign out of Veladon?"
        message="You'll need to sign in again next time you open the app."
        confirmLabel="Sign Out"
        onCancel={() => setSignOutOpen(false)}
        onConfirm={() => { setSignOutOpen(false); signOut(); }}
      />
    </Screen>
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
      }}
    >
      {icon}
      <Text style={[t.type.body, { flex: 1, color }]}>{label}</Text>
      <ChevronRight size={16} color={t.colors.textSecondary} />
    </Pressable>
  );
}
