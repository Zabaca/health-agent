import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
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

function agentInitials(a: DesignatedAgent): string {
  if (a.agentUser?.firstName && a.agentUser?.lastName) {
    return `${a.agentUser.firstName[0]}${a.agentUser.lastName[0]}`.toUpperCase();
  }
  return a.inviteeEmail[0].toUpperCase();
}

function permLabel(value: string | null, key: string): string {
  if (!value) return `${key}: None`;
  return `${key}: ${value.charAt(0).toUpperCase()}${value.slice(1)}`;
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
      <Header title="My Designated Agents" onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ gap: 12 }}>
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
          agents.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => nav.navigate("RepresentativeDetail", { agent: a })}
            >
              <View
                style={{
                  backgroundColor: t.colors.surface,
                  borderRadius: t.radius.card,
                  borderWidth: 1,
                  borderColor: t.colors.border,
                  padding: 14,
                  gap: 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: t.colors.primaryBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: t.colors.primary, fontWeight: "700" }}>{agentInitials(a)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={t.type.bodyStrong}>{agentDisplayName(a)}</Text>
                    {a.relationship ? <Text style={t.type.caption}>{a.relationship}</Text> : null}
                  </View>
                  <Badge
                    label={a.status === "accepted" ? "Active" : "Pending"}
                    variant={a.status === "accepted" ? "success" : "accent"}
                  />
                </View>

                <Text style={t.type.caption}>
                  Invited {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {a.status === "pending" && a.tokenExpiresAt
                    ? ` · Expires ${new Date(a.tokenExpiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : ""}
                </Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  <PermPill label={permLabel(a.healthRecordsPermission, "Records")} value={a.healthRecordsPermission} />
                  {a.manageProvidersPermission ? (
                    <PermPill label={permLabel(a.manageProvidersPermission, "Providers")} value={a.manageProvidersPermission} />
                  ) : null}
                  <PermPill label={permLabel(a.releasePermission, "Releases")} value={a.releasePermission} />
                </View>

                <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                  {a.status === "accepted" ? (
                    <>
                      <SecondaryAction
                        label="Revoke"
                        tone="destructive"
                        onPress={() => setConfirmAgent(a)}
                      />
                      <SecondaryAction
                        label="Edit Permissions"
                        onPress={() => nav.navigate("RepresentativeDetail", { agent: a })}
                      />
                    </>
                  ) : (
                    <>
                      <SecondaryAction label="Resend Invite" onPress={() => {}} />
                      <SecondaryAction
                        label="Revoke"
                        tone="destructive"
                        onPress={() => setConfirmAgent(a)}
                      />
                    </>
                  )}
                </View>
              </View>
            </Pressable>
          ))
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

function PermPill({ label, value }: { label: string; value: string | null }) {
  const t = useTheme();
  const tone = value === "editor" ? t.colors.primary : value === "viewer" ? t.colors.accent : t.colors.textSecondary;
  return (
    <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: t.radius.pill, backgroundColor: t.colors.surfaceSubtle }}>
      <Text style={{ fontSize: 12, color: tone, fontWeight: "500" }}>{label}</Text>
    </View>
  );
}

function SecondaryAction({
  label,
  tone,
  onPress,
}: {
  label: string;
  tone?: "destructive";
  onPress: () => void;
}) {
  const t = useTheme();
  const isDestructive = tone === "destructive";
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: t.radius.button,
        backgroundColor: isDestructive ? t.colors.destructiveBg : t.colors.surfaceSubtle,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: isDestructive ? t.colors.destructive : t.colors.textPrimary }}>
        {label}
      </Text>
    </Pressable>
  );
}
