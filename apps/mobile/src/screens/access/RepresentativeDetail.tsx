import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ban } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { PermissionPicker } from "@/components/PermissionPicker";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { mockAgents } from "@/mock/agents";
import type { AccessParamList } from "@/navigation/types";

type R = RouteProp<AccessParamList, "RepresentativeDetail">;
type Nav = NativeStackNavigationProp<AccessParamList>;

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

export default function RepresentativeDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const agent = mockAgents.find((a) => a.id === params.agentId) ?? mockAgents[2];

  const [records, setRecords] = useState<"None" | "Viewer" | "Editor">(cap(agent.permissions.records) as any);
  const [providers, setProviders] = useState<"None" | "Viewer" | "Editor">(cap(agent.permissions.providers) as any);
  const [releases, setReleases] = useState<"None" | "Viewer" | "Editor">(cap(agent.permissions.releases) as any);
  const [revokeOpen, setRevokeOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Representative Detail" onBack={() => nav.goBack()} rightAction={{ label: "Save", onPress: () => nav.goBack() }} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Pressable
              onPress={() => setRevokeOpen(true)}
              style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.destructive, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }}
            >
              <Ban size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Revoke Access</Text>
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
            <Text style={{ color: t.colors.primary, fontWeight: "700" }}>{agent.initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={t.type.bodyStrong}>{agent.name}</Text>
            <Text style={t.type.caption}>{agent.role}</Text>
            {agent.email ? <Text style={[t.type.caption, { color: t.colors.primary }]}>{agent.email}</Text> : null}
            <Text style={[t.type.caption, { marginTop: 4 }]}>Access granted {agent.invitedOn}</Text>
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

      <ConfirmDrawer
        visible={revokeOpen}
        title={`Revoke ${agent.name}'s access?`}
        message="They will immediately lose access to your records, providers, and release requests. You can re-invite them later."
        confirmLabel="Revoke Access"
        onCancel={() => setRevokeOpen(false)}
        onConfirm={() => { setRevokeOpen(false); nav.goBack(); }}
      />
    </View>
  );
}
