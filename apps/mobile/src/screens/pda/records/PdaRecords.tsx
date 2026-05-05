import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { FileText, FolderHeart, ShieldOff, Eye } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/theme/ThemeProvider";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import { listRepresentingRecords, type RepresentingRecord } from "@/lib/api";
import type { PdaRecordsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaRecordsParamList>;

function fileLabel(r: RepresentingRecord) {
  return r.originalName ?? r.fileType.toUpperCase();
}

function fileDate(r: RepresentingRecord) {
  return new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PdaRecords() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { currentPatient } = useRepresentedPatients();

  const [files, setFiles] = useState<RepresentingRecord[]>([]);
  const [perm, setPerm] = useState<"viewer" | "editor" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentPatient) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listRepresentingRecords(currentPatient.patientId);
      setFiles(res.files);
      setPerm(res.permission);
    } catch {
      setError("Could not load records.");
    } finally {
      setLoading(false);
    }
  }, [currentPatient]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const firstName = currentPatient
    ? (currentPatient.firstName ?? "the patient")
    : "the patient";

  const patientName = currentPatient
    ? `${currentPatient.firstName ?? ""} ${currentPatient.lastName ?? ""}`.trim()
    : "";

  const headerRow = (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={[t.type.h1, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        Health Records
      </Text>
    </View>
  );

  if (loading) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      </Screen>
    );
  }

  if (!perm) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <EmptyState
          icon={<ShieldOff size={32} color={t.colors.textSecondary} />}
          title="No access to records"
          subtitle={`${patientName || "This patient"} hasn't granted you access to their health records. Ask them to update your permissions from their account settings.`}
        />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <View style={{ paddingVertical: 40, alignItems: "center" }}>
          <Text style={[t.type.caption, { color: t.colors.destructive }]}>{error}</Text>
        </View>
      </Screen>
    );
  }

  if (files.length === 0) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <EmptyState
          icon={<FolderHeart size={32} color={t.colors.primary} />}
          iconBg={t.colors.primaryBg}
          title="No records yet"
          subtitle={`Upload ${firstName}'s medical records or wait for providers to send them in via HIPAA release.`}
        />
      </Screen>
    );
  }

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      {headerRow}

      {perm === "viewer" ? (
        <View
          style={{
            backgroundColor: t.colors.primaryBg,
            borderRadius: t.radius.card,
            padding: 14,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <Eye size={16} color={t.colors.primary} />
          <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
            Viewer access — you can view {firstName}'s records but cannot upload or delete.
          </Text>
        </View>
      ) : null}

      {files.map((r) => (
        <Pressable
          key={r.id}
          onPress={() =>
            nav.navigate("PdaRecordDetail", {
              fileId: r.id,
              fileURL: r.fileURL,
              fileType: r.fileType,
              source: r.source,
              createdAt: r.createdAt,
              pagecount: r.pagecount,
              originalName: r.originalName,
            })
          }
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
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: t.colors.primaryBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={20} color={t.colors.primary} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={t.type.bodyStrong} numberOfLines={1}>
                {fileLabel(r)}
              </Text>
              <Text style={t.type.caption}>{r.source} · {fileDate(r)}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
