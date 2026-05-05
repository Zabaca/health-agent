import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, User } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { listMyDesignatedAgents, revokeDesignatedAgent, ApiError, type DesignatedAgent } from "@/lib/api";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

function agentDisplayName(a: DesignatedAgent): string {
  if (a.agentUser?.firstName || a.agentUser?.lastName) {
    return `${a.agentUser.firstName ?? ""} ${a.agentUser.lastName ?? ""}`.trim();
  }
  return a.inviteeEmail;
}

function isInviteExpired(a: DesignatedAgent): boolean {
  return !!a.tokenExpiresAt && new Date(a.tokenExpiresAt) < new Date();
}

function AgentAvatar({ agent, isActive }: { agent: DesignatedAgent; isActive: boolean }) {
  const t = useTheme();
  const [imgErr, setImgErr] = useState(false);

  const bgColor = isActive ? "#C8F0D8" : t.colors.bg;
  const fgColor = isActive ? t.colors.primary : "#6D6C6A";
  const base = {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: bgColor,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    overflow: "hidden" as const,
  };

  const avatarUrl = agent.agentUser?.avatarUrl;
  const firstName = agent.agentUser?.firstName;
  const lastName = agent.agentUser?.lastName;

  if (avatarUrl && !imgErr) {
    return (
      <View style={base}>
        <Image source={{ uri: avatarUrl }} style={{ width: 44, height: 44 }} onError={() => setImgErr(true)} />
      </View>
    );
  }

  if (firstName || lastName) {
    const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
    return (
      <View style={base}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: fgColor }}>{initials}</Text>
      </View>
    );
  }

  return (
    <View style={base}>
      <User size={20} color={fgColor} />
    </View>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <View style={{ height: 26, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#C8F0D8", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 11, fontWeight: "600", color: "#3D8A5A" }}>Active</Text>
      </View>
    );
  }
  return (
    <View style={{ height: 26, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#FEF9C3", borderWidth: 1, borderColor: "#B7791F30", alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 11, fontWeight: "600", color: "#B7791F" }}>Pending</Text>
    </View>
  );
}

function PermPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 4, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: 10, fontWeight: "500", color }}>{label}</Text>
    </View>
  );
}

function ActionBtn({ label, tone, onPress }: { label: string; tone?: "destructive"; onPress: () => void }) {
  const t = useTheme();
  const isDestructive = tone === "destructive";
  return (
    <Pressable
      onPress={onPress}
      style={{
        height: 34,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: isDestructive ? t.colors.destructiveBg : t.colors.surfaceSubtle,
        alignItems: "center",
        justifyContent: "center",
        ...(isDestructive ? { borderWidth: 1, borderColor: "#C0392B30" } : {}),
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "500", color: isDestructive ? t.colors.destructive : t.colors.textPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function AccessList() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [agents, setAgents] = useState<DesignatedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmAgent, setConfirmAgent] = useState<DesignatedAgent | null>(null);
  const [revoking, setRevoking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { designatedAgents } = await listMyDesignatedAgents();
      setAgents(designatedAgents.filter((a) => a.status !== "revoked"));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load agents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRevoke = async () => {
    if (!confirmAgent) return;
    setRevoking(true);
    try {
      await revokeDesignatedAgent(confirmAgent.id);
      setAgents((prev) => prev.filter((a) => a.id !== confirmAgent.id));
    } catch {
      // keep drawer closed; error visible on reload
    } finally {
      setConfirmAgent(null);
      setRevoking(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header
        title="My Designated Agents"
        onBack={() => nav.goBack()}
        rightAction={{
          icon: (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: t.colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 }}>
              <Plus size={13} color="#fff" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Invite</Text>
            </View>
          ),
          onPress: () => nav.navigate("InviteRepresentative"),
        }}
      />
      <Screen contentContainerStyle={{ gap: 24 }}>
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : error ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Text style={[t.type.caption, { color: t.colors.destructive }]}>{error}</Text>
          </View>
        ) : agents.length === 0 ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Text style={t.type.caption}>No designated agents yet.</Text>
          </View>
        ) : (
          agents.map((a) => {
            const isActive = a.status === "accepted";
            const expired = !isActive && isInviteExpired(a);
            return (
              <Pressable
                key={a.id}
                onPress={() => nav.navigate("RepresentativeDetail", { agent: a })}
              >
                <View
                  style={{
                    backgroundColor: t.colors.surface,
                    borderRadius: 16,
                    padding: 18,
                    gap: 14,
                    shadowColor: "#1A1918",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.063,
                    shadowRadius: 12,
                    elevation: 3,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                    <AgentAvatar agent={a} isActive={isActive} />
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontSize: 15, fontWeight: "600", color: t.colors.textPrimary }}>
                        {agentDisplayName(a)}
                      </Text>
                      {a.relationship ? (
                        <Text style={{ fontSize: 12, color: "#6D6C6A" }}>{a.relationship}</Text>
                      ) : null}
                    </View>
                    <StatusBadge isActive={isActive} />
                  </View>

                  <Text style={{ fontSize: 12, color: t.colors.textSecondary }}>
                    {`Invited ${new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
                    {!isActive && a.tokenExpiresAt
                      ? ` · ${expired ? "Expired" : "Expires"} ${new Date(a.tokenExpiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                      : ""}
                  </Text>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    <PermPill label={`records: ${a.healthRecordsPermission ?? "none"}`} color="#3D8A5A" bg="#3D8A5A15" />
                    {a.manageProvidersPermission ? (
                      <PermPill label={`providers: ${a.manageProvidersPermission}`} color="#008080" bg="#00808015" />
                    ) : null}
                    <PermPill label={`releases: ${a.releasePermission ?? "none"}`} color="#6B46C1" bg="#6B46C115" />
                  </View>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {isActive ? (
                      <>
                        <ActionBtn label="Revoke" tone="destructive" onPress={() => setConfirmAgent(a)} />
                        <ActionBtn label="Edit Permissions" onPress={() => nav.navigate("RepresentativeDetail", { agent: a })} />
                      </>
                    ) : (
                      <>
                        {expired && <ActionBtn label="Resend Invite" onPress={() => {}} />}
                        <ActionBtn label="Edit Permissions" onPress={() => nav.navigate("RepresentativeDetail", { agent: a })} />
                        <ActionBtn label="Revoke" tone="destructive" onPress={() => setConfirmAgent(a)} />
                      </>
                    )}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </Screen>

      <ConfirmDrawer
        visible={!!confirmAgent}
        title={confirmAgent ? `Revoke ${agentDisplayName(confirmAgent)}'s access?` : ""}
        message="They will immediately lose access to your records, providers, and release requests."
        confirmLabel={revoking ? "Revoking…" : "Revoke Access"}
        tone="destructive"
        onCancel={() => setConfirmAgent(null)}
        onConfirm={onRevoke}
      />
    </View>
  );
}
