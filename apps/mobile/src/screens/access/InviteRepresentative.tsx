import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Send, ChevronDown, Check } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { PermissionPicker } from "@/components/PermissionPicker";
import { useTheme } from "@/theme/ThemeProvider";
import { inviteDesignatedAgent, ApiError } from "@/lib/api";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;
type PermValue = "None" | "Viewer" | "Editor";

const RELATIONSHIPS = ["Spouse", "Son", "Daughter", "Parent", "Sibling", "Caregiver", "Friend", "Other"] as const;

function toApiPerm(v: PermValue): "viewer" | "editor" | null {
  if (v === "Viewer") return "viewer";
  if (v === "Editor") return "editor";
  return null;
}

function RelationshipSheet({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: string | null;
  onSelect: (v: string | null) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: t.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 8,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <View style={{ alignItems: "center", paddingBottom: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
          </View>
          <Text style={[t.type.h3, { paddingHorizontal: 24, paddingBottom: 12 }]}>Relationship</Text>
          <ScrollView>
            {selected !== null && (
              <Pressable
                onPress={() => { onSelect(null); onClose(); }}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 14, borderTopWidth: 1, borderTopColor: t.colors.divider }}
              >
                <Text style={[t.type.body, { color: t.colors.textSecondary }]}>Clear selection</Text>
              </Pressable>
            )}
            {RELATIONSHIPS.map((r) => {
              const on = selected === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => { onSelect(r); onClose(); }}
                  style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingVertical: 14, borderTopWidth: 1, borderTopColor: t.colors.divider }}
                >
                  <Text style={[t.type.body, { fontWeight: on ? "600" : "400" }]}>{r}</Text>
                  {on && <Check size={18} color={t.colors.primary} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function InviteRepresentative() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState<string | null>(null);
  const [showRelPicker, setShowRelPicker] = useState(false);
  const [records, setRecords] = useState<PermValue>("Editor");
  const [providers, setProviders] = useState<PermValue>("None");
  const [releases, setReleases] = useState<PermValue>("None");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = email.trim().length > 0 && email.includes("@");

  const onSend = async () => {
    if (!canSend || loading) return;
    setError(null);
    setLoading(true);
    try {
      await inviteDesignatedAgent({
        inviteeEmail: email.trim().toLowerCase(),
        ...(relationship ? { relationship } : {}),
        healthRecordsPermission: toApiPerm(records),
        manageProvidersPermission: toApiPerm(providers),
        releasePermission: toApiPerm(releases),
      });
      nav.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to send invite. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Invite Representative" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16, gap: 8 }}>
            {error ? (
              <Text style={[t.type.caption, { color: t.colors.destructive, textAlign: "center" }]}>{error}</Text>
            ) : null}
            <Pressable
              onPress={onSend}
              disabled={!canSend || loading}
              style={{
                height: 52,
                borderRadius: t.radius.button,
                backgroundColor: canSend && !loading ? t.colors.primary : t.colors.primary40,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Send size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
                {loading ? "Sending…" : "Send Invite"}
              </Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        <Input
          label="Email"
          placeholder="representative@example.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Input
          label="Relationship (optional)"
          placeholder="e.g. Spouse, Caregiver…"
          value={relationship ?? ""}
          onChangeText={(v) => setRelationship(v || null)}
          autoCorrect={false}
          rightElement={
            <Pressable onPress={() => setShowRelPicker(true)} hitSlop={8}>
              <ChevronDown size={18} color={t.colors.textSecondary} />
            </Pressable>
          }
        />

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

      <RelationshipSheet
        visible={showRelPicker}
        selected={relationship}
        onSelect={setRelationship}
        onClose={() => setShowRelPicker(false)}
      />
    </View>
  );
}
