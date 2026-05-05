import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ban } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { PermissionPicker } from "@/components/PermissionPicker";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { updateDesignatedAgent, revokeDesignatedAgent, ApiError, type DesignatedAgent } from "@/lib/api";
import type { ProfileParamList } from "@/navigation/types";

type R = RouteProp<ProfileParamList, "RepresentativeDetail">;
type Nav = NativeStackNavigationProp<ProfileParamList>;
type UiPerm = "None" | "Viewer" | "Editor";

function toUiPerm(v: string | null): UiPerm {
  if (!v) return "None";
  return (v.charAt(0).toUpperCase() + v.slice(1)) as UiPerm;
}

function toApiPerm(v: UiPerm): 'viewer' | 'editor' | null {
  if (v === "None") return null;
  return v.toLowerCase() as 'viewer' | 'editor';
}

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

export default function RepresentativeDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const agent = params.agent;

  const [records, setRecords] = useState<UiPerm>(toUiPerm(agent.healthRecordsPermission));
  const [providers, setProviders] = useState<UiPerm>(toUiPerm(agent.manageProvidersPermission));
  const [releases, setReleases] = useState<UiPerm>(toUiPerm(agent.releasePermission));
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateDesignatedAgent(agent.id, {
        healthRecordsPermission: toApiPerm(records),
        manageProvidersPermission: toApiPerm(providers),
        releasePermission: toApiPerm(releases),
      });
      nav.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const onRevoke = async () => {
    setRevoking(true);
    try {
      await revokeDesignatedAgent(agent.id);
      setRevokeOpen(false);
      nav.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not revoke access.");
      setRevokeOpen(false);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header
        title="Representative Detail"
        onBack={() => nav.goBack()}
        rightAction={saving
          ? { icon: <ActivityIndicator size="small" color={t.colors.primary} />, onPress: onSave }
          : { label: "Save", onPress: onSave }
        }
      />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Pressable
              onPress={() => setRevokeOpen(true)}
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
              {revoking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ban size={16} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Revoke Access</Text>
                </>
              )}
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
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: t.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: t.colors.primary, fontWeight: "700" }}>{agentInitials(agent)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={t.type.bodyStrong}>{agentDisplayName(agent)}</Text>
            {agent.relationship ? <Text style={t.type.caption}>{agent.relationship}</Text> : null}
            <Text style={[t.type.caption, { color: t.colors.primary }]}>{agent.inviteeEmail}</Text>
            <Text style={[t.type.caption, { marginTop: 4 }]}>
              Access granted {new Date(agent.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </Text>
          </View>
        </View>

        {error ? (
          <Text style={{ color: t.colors.destructive, textAlign: "center" }}>{error}</Text>
        ) : null}

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

      <ConfirmDrawer
        visible={revokeOpen}
        title={`Revoke ${agentDisplayName(agent)}'s access?`}
        message="They will immediately lose access to your records, providers, and release requests. You can re-invite them later."
        confirmLabel="Revoke Access"
        tone="destructive"
        onCancel={() => setRevokeOpen(false)}
        onConfirm={onRevoke}
      />
    </View>
  );
}
