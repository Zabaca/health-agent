import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, ChevronRight, Info, ShieldOff, ClipboardList, Eye } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { useTheme } from "@/theme/ThemeProvider";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import { listRepresentingReleases, type RepresentingReleaseSummary } from "@/lib/api";
import type { PdaReleasesParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

function releaseStatus(r: RepresentingReleaseSummary): "active" | "pending" | "voided" {
  if (r.voided) return "voided";
  return r.authSignatureImage ? "active" : "pending";
}

function releaseProviderLabel(r: RepresentingReleaseSummary) {
  const names = r.providerNames.filter(Boolean) as string[];
  if (names.length === 0) return "Unknown provider";
  return names.length === 1 ? names[0] : `${names[0]} +${names.length - 1} more`;
}

function releaseDate(r: RepresentingReleaseSummary) {
  return new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function PdaReleases() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { currentPatient, loading: patientsLoading } = useRepresentedPatients();
  const perm = currentPatient?.releasePermission ?? null;
  const isEditor = perm === "editor";
  const firstName = currentPatient?.firstName ?? "the patient";
  const patientName = currentPatient
    ? `${currentPatient.firstName ?? ""} ${currentPatient.lastName ?? ""}`.trim()
    : "";

  const [releases, setReleases] = useState<RepresentingReleaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentPatient || !perm) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await listRepresentingReleases(currentPatient.patientId);
      setReleases(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load releases");
    } finally {
      setLoading(false);
    }
  }, [currentPatient, perm]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const headerRow = (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={[t.type.h1, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        HIPAA Releases
      </Text>
      {isEditor ? (
        <Pressable
          onPress={() => nav.navigate("PdaWizardStep1")}
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
          <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Add</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (patientsLoading || loading) {
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
          title="No access to releases"
          subtitle={`${patientName || "This patient"} hasn't granted you access to HIPAA releases. Ask them to update your permissions from their account settings.`}
        />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <ErrorState title="Couldn't load releases" message={error} onRetry={load} />
      </Screen>
    );
  }

  if (releases.length === 0) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <EmptyState
          icon={<ClipboardList size={32} color={t.colors.primary} />}
          iconBg={t.colors.primaryBg}
          title="No releases yet"
          subtitle={`Create your first HIPAA release on ${firstName}'s behalf to authorize a provider to share records.`}
          actions={
            isEditor
              ? [
                  {
                    label: "Create Release",
                    icon: <Plus size={16} color="#FFFFFF" />,
                    onPress: () => nav.navigate("PdaWizardStep1"),
                  },
                ]
              : []
          }
        />
      </Screen>
    );
  }

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      {headerRow}

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
        {isEditor ? <Info size={16} color={t.colors.primary} /> : <Eye size={16} color={t.colors.primary} />}
        <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
          {isEditor
            ? "Showing releases where you are designated as the representative."
            : `Viewer access — you can view ${firstName}'s releases but cannot create or revoke.`}
        </Text>
      </View>

      {releases.map((r) => {
        const status = releaseStatus(r);
        return (
          <Pressable key={r.id} onPress={() => nav.navigate("PdaReleaseDetail", { releaseId: r.id })}>
            <View
              style={{
                backgroundColor: t.colors.surface,
                borderRadius: t.radius.card,
                borderWidth: 1,
                borderColor: t.colors.border,
                padding: 14,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={[t.type.bodyStrong, { flex: 1, marginRight: 8 }]} numberOfLines={1}>
                  {releaseProviderLabel(r)}
                </Text>
                <Badge
                  label={status === "active" ? "Active" : status === "voided" ? "Voided" : "Pending Signature"}
                  variant={status === "active" ? "success" : "accent"}
                />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={t.type.caption}>{releaseDate(r)}</Text>
                <ChevronRight size={16} color={t.colors.textSecondary} />
              </View>
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}
