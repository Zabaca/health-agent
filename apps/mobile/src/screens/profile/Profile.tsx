import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, Settings, Repeat, User } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, listMyDesignatedAgents, listRepresentedPatients, type ProfileData, type DesignatedAgent, type RepresentedPatient } from "@/lib/api";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

function agentDisplayName(a: DesignatedAgent): string {
  if (a.agentUser?.firstName || a.agentUser?.lastName) {
    return `${a.agentUser.firstName ?? ""} ${a.agentUser.lastName ?? ""}`.trim();
  }
  return a.inviteeEmail;
}

export default function Profile() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { switchTo } = useRole();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [agents, setAgents] = useState<DesignatedAgent[]>([]);
  const [representedPatients, setRepresentedPatients] = useState<RepresentedPatient[]>([]);
  const [profileLoading, setProfileLoading] = useState(true);
  const [agentsLoading, setAgentsLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    getProfile()
      .then(setProfile)
      .catch(() => {})
      .finally(() => setProfileLoading(false));
    listMyDesignatedAgents()
      .then(({ designatedAgents }) =>
        setAgents(designatedAgents.filter((a) => a.status !== "revoked"))
      )
      .catch(() => {})
      .finally(() => setAgentsLoading(false));
    listRepresentedPatients().then(setRepresentedPatients).catch(() => {});
  }, []));

  const initials = profile
    ? `${profile.firstName?.[0] ?? ""}${profile.lastName?.[0] ?? ""}`.toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? "?";
  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : null;

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text
          style={[t.type.h1, { flex: 1 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          Profile
        </Text>
        <Pressable onPress={() => nav.navigate("AccountSettings")}>
          <Settings size={22} color={t.colors.textPrimary} />
        </Pressable>
      </View>

      {/* User card */}
      <Pressable onPress={() => nav.navigate("EditProfile")}>
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
              borderRadius: 12,
              backgroundColor: t.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {profileLoading ? (
              <ActivityIndicator size="small" color={t.colors.primary} />
            ) : profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={{ width: 44, height: 44 }} />
            ) : initials ? (
              <Text style={{ color: t.colors.primary, fontWeight: "700" }}>{initials}</Text>
            ) : (
              <User size={22} color={t.colors.primary} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={t.type.bodyStrong}>
              {profileLoading ? "Loading…" : (displayName ?? user?.email ?? "")}
            </Text>
            <Text style={t.type.caption}>{user?.email}</Text>
          </View>
          <ChevronRight size={18} color={t.colors.textSecondary} />
        </View>
      </Pressable>

      {/* Health Sources — static, not wired */}
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          overflow: "hidden",
        }}
      >
        <View style={{ paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, backgroundColor: t.colors.surfaceSubtle }}>
          <Text style={[t.type.sectionLabel, { textTransform: "uppercase" }]}>HEALTH SOURCES</Text>
        </View>
        <Pressable onPress={() => nav.navigate("ConnectAppleHealth")}>
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.accent }} />
            <Text style={[t.type.body, { flex: 1 }]}>Apple Health</Text>
            <Text style={{ color: t.colors.accent, fontWeight: "600" }}>Tap to connect</Text>
          </View>
        </Pressable>
      </View>

      {/* Designated Agents */}
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          overflow: "hidden",
        }}
      >
        <Pressable onPress={() => nav.navigate("DesignatedAgents")}>
          <View
            style={{
              paddingHorizontal: 14,
              paddingTop: 12,
              paddingBottom: 8,
              backgroundColor: t.colors.surfaceSubtle,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text style={[t.type.sectionLabel, { textTransform: "uppercase", flex: 1 }]}>MY DESIGNATED AGENTS</Text>
            <ChevronRight size={16} color={t.colors.textSecondary} />
          </View>
        </Pressable>
        {agentsLoading ? (
          <View style={{ paddingVertical: 16, alignItems: "center" }}>
            <ActivityIndicator size="small" color={t.colors.textSecondary} />
          </View>
        ) : agents.length === 0 ? (
          <View style={{ paddingHorizontal: 14, paddingVertical: 14 }}>
            <Text style={t.type.caption}>No designated agents yet.</Text>
          </View>
        ) : (
          agents.slice(0, 2).map((a, i) => (
            <Pressable
              key={a.id}
              onPress={() => nav.navigate("RepresentativeDetail", { agent: a })}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: t.colors.divider,
                  gap: 8,
                }}
              >
                <Text style={[t.type.body, { flex: 1 }]}>
                  <Text style={{ fontWeight: "600" }}>{agentDisplayName(a)}</Text>
                  {a.relationship ? (
                    <Text style={{ color: t.colors.textSecondary }}> — {a.relationship}</Text>
                  ) : null}
                </Text>
                <ChevronRight size={16} color={t.colors.textSecondary} />
              </View>
            </Pressable>
          ))
        )}
      </View>

      {/* Switch to Representative View — only shown when the user is a PDA with at least one accepted patient */}
      {representedPatients.length > 0 ? (
        <Pressable
          onPress={() => switchTo("pda", representedPatients[0].patientId)}
          style={{
            backgroundColor: "#EAF1FB",
            borderRadius: t.radius.card,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Repeat size={18} color="#4A78C8" />
          <Text style={[t.type.bodyStrong, { color: "#4A78C8", flex: 1 }]}>Switch to Representative View</Text>
          <ChevronRight size={18} color="#4A78C8" />
        </Pressable>
      ) : null}
    </Screen>
  );
}
