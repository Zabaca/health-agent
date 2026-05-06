import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Check } from "lucide-react-native";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { listReleases, patchRecord, type ReleaseSummary } from "@/lib/api";

function RadioDot({ selected, color, border }: { selected: boolean; color: string; border: string }) {
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: selected ? 0 : 1.5,
        borderColor: border,
        backgroundColor: selected ? color : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {selected ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
    </View>
  );
}

type Props = {
  fileId: string;
  name: string;
  releaseCode: string | null;
  source: string;
  onClose: () => void;
  onSaved: (name: string, releaseCode: string | null) => void;
};

export function EditRecordForm({ fileId, name, releaseCode, source, onClose, onSaved }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  const [draftName, setDraftName] = useState(name);
  const [draftCode, setDraftCode] = useState<string | null>(releaseCode);
  const [releases, setReleases] = useState<ReleaseSummary[]>([]);
  const [loadingReleases, setLoadingReleases] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listReleases()
      .then((all) => setReleases(all.filter((r) => !r.voided && r.releaseCode)))
      .catch(() => {})
      .finally(() => setLoadingReleases(false));
  }, []);

  const isUpload = source === "upload";
  const nameChanged = isUpload && draftName.trim() !== name;
  const codeChanged = draftCode !== releaseCode;
  const hasChanges = nameChanged || codeChanged;

  const save = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    setError(null);
    try {
      const body: { originalName?: string; releaseCode?: string | null } = {};
      if (nameChanged) body.originalName = draftName.trim();
      if (codeChanged) body.releaseCode = draftCode;
      await patchRecord(fileId, body);
      onSaved(isUpload ? draftName.trim() : name, draftCode);
    } catch {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: 4,
        }}
      >
        <Text style={t.type.h3}>File Details</Text>
        <Pressable onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ color: t.colors.textSecondary, fontSize: 15 }}>Cancel</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {isUpload ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Text style={[t.type.sectionLabel, { textTransform: "uppercase", marginBottom: 8 }]}>File Name</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              style={{
                height: 48,
                paddingHorizontal: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: t.colors.border,
                backgroundColor: t.colors.bg,
                color: t.colors.textPrimary,
                fontSize: 15,
              }}
              placeholderTextColor={t.colors.textPlaceholder}
              placeholder="File name"
              autoCorrect={false}
              returnKeyType="done"
            />
          </View>
        ) : null}

        <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
          <Text style={[t.type.sectionLabel, { textTransform: "uppercase", marginBottom: 8 }]}>Release</Text>
          {loadingReleases ? (
            <ActivityIndicator color={t.colors.primary} style={{ marginTop: 8 }} />
          ) : releases.length === 0 ? (
            <Text style={[t.type.caption, { color: t.colors.textSecondary, paddingTop: 4 }]}>
              No releases found. Create a release first to associate this record.
            </Text>
          ) : (
            <View style={{ borderRadius: 12, borderWidth: 1, borderColor: t.colors.border, overflow: "hidden" }}>
              <Pressable
                onPress={() => setDraftCode(null)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 14,
                  paddingVertical: 14,
                  gap: 12,
                  backgroundColor: draftCode === null ? `${t.colors.primary}10` : t.colors.bg,
                }}
              >
                <RadioDot selected={draftCode === null} color={t.colors.primary} border={t.colors.border} />
                <Text style={[t.type.body, { color: draftCode === null ? t.colors.primary : t.colors.textSecondary }]}>
                  None
                </Text>
              </Pressable>

              {releases.map((r) => {
                const selected = draftCode === r.releaseCode;
                return (
                  <Pressable
                    key={r.id}
                    onPress={() => setDraftCode(r.releaseCode)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 14,
                      paddingVertical: 14,
                      gap: 12,
                      borderTopWidth: 1,
                      borderTopColor: t.colors.border,
                      backgroundColor: selected ? `${t.colors.primary}10` : t.colors.bg,
                    }}
                  >
                    <RadioDot selected={selected} color={t.colors.primary} border={t.colors.border} />
                    <View style={{ flex: 1 }}>
                      <Text style={[t.type.bodyStrong, { color: selected ? t.colors.primary : t.colors.textPrimary }]}>
                        {r.releaseCode}
                      </Text>
                      {r.providerName ? (
                        <Text style={[t.type.caption, { color: selected ? t.colors.primary : t.colors.textSecondary }]}>
                          {r.providerName}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {error ? (
          <Text style={{ color: t.colors.destructive, fontSize: 13, paddingHorizontal: 20, paddingTop: 12 }}>
            {error}
          </Text>
        ) : null}
      </ScrollView>

      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 }}>
        <View style={{ flex: 1 }}>
          <Button label="Cancel" variant="secondary" onPress={onClose} fullWidth />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={saving ? "Saving…" : "Save Changes"}
            onPress={save}
            fullWidth
            disabled={!hasChanges || saving}
          />
        </View>
      </View>
    </View>
  );
}
