import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { useTheme } from "@/theme/ThemeProvider";
import { mockAgents } from "@/mock/agents";
import type { AccessParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<AccessParamList>;

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const permissionLabel = (key: string, value: string) => `${cap(key)}: ${cap(value)}`;

export default function AccessList() {
  const t = useTheme();
  const nav = useNavigation<Nav>();

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Text
          style={[t.type.h1, { flex: 1 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          My Designated Agents
        </Text>
        <Pressable
          onPress={() => nav.navigate("InviteRepresentative")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: t.colors.primary,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: t.radius.pill,
          }}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Invite</Text>
        </Pressable>
      </View>

      <View style={{ gap: 12 }}>
        {mockAgents.slice(0, 2).map((a) => (
          <Pressable key={a.id} onPress={() => nav.navigate("RepresentativeDetail", { agentId: a.id })}>
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
                  <Text style={{ color: t.colors.primary, fontWeight: "700" }}>{a.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={t.type.bodyStrong}>{a.name}</Text>
                  <Text style={t.type.caption}>{a.role}</Text>
                </View>
                <Badge label={a.status === "active" ? "Active" : "Pending"} variant={a.status === "active" ? "success" : "accent"} />
              </View>

              <Text style={t.type.caption}>
                Invited {a.invitedOn}{a.expiresIn ? ` · ${a.expiresIn}` : ""}
              </Text>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                <PermPill k="records" v={a.permissions.records} />
                {a.permissions.providers !== "none" ? <PermPill k="providers" v={a.permissions.providers} /> : null}
                <PermPill k="releases" v={a.permissions.releases} />
              </View>

              <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
                {a.status === "active" ? (
                  <>
                    <SecondaryAction label="Revoke" tone="destructive" />
                    <SecondaryAction label="Edit Permissions" />
                  </>
                ) : (
                  <>
                    <SecondaryAction label="Resend Invite" />
                    <SecondaryAction label="Revoke" tone="destructive" />
                  </>
                )}
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

function PermPill({ k, v }: { k: string; v: string }) {
  const t = useTheme();
  const tone = v === "editor" ? t.colors.primary : v === "viewer" ? t.colors.accent : t.colors.textSecondary;
  return (
    <View style={{ paddingVertical: 4, paddingHorizontal: 10, borderRadius: t.radius.pill, backgroundColor: t.colors.surfaceSubtle }}>
      <Text style={{ fontSize: 12, color: tone, fontWeight: "500" }}>{permissionLabel(k, v)}</Text>
    </View>
  );
}

function SecondaryAction({ label, tone }: { label: string; tone?: "destructive" }) {
  const t = useTheme();
  const isDestructive = tone === "destructive";
  return (
    <Pressable
      style={{
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: t.radius.button,
        backgroundColor: isDestructive ? t.colors.destructiveBg : t.colors.surfaceSubtle,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "600", color: isDestructive ? t.colors.destructive : t.colors.textPrimary }}>{label}</Text>
    </Pressable>
  );
}
