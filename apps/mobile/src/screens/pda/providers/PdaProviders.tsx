import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, Plus, Eye, Pencil, ShieldOff, Stethoscope } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/theme/ThemeProvider";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import { listRepresentingProviders, type UserProvider } from "@/lib/api";
import type { PdaProvidersParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaProvidersParamList>;

function providerTitle(p: UserProvider) {
  return p.physicianName ?? p.providerName;
}

function providerSubtitle(p: UserProvider) {
  if (p.physicianName) return `${p.providerType} · ${p.providerName}`;
  return p.providerType;
}

export default function PdaProviders() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { currentPatient, loading: patientsLoading } = useRepresentedPatients();
  const perm = currentPatient?.manageProvidersPermission ?? null;
  const isEditor = perm === "editor";
  const firstName = currentPatient?.firstName ?? "the patient";
  const patientName = currentPatient
    ? `${currentPatient.firstName ?? ""} ${currentPatient.lastName ?? ""}`.trim()
    : "";

  const [providers, setProviders] = useState<UserProvider[]>([]);
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
      const list = await listRepresentingProviders(currentPatient.patientId);
      setProviders(list);
    } catch {
      setError("Could not load providers.");
    } finally {
      setLoading(false);
    }
  }, [currentPatient, perm]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const headerRow = (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={[t.type.h1, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        Providers
      </Text>
      {isEditor ? (
        <Pressable hitSlop={8} onPress={() => nav.navigate("PdaAddProvider")}>
          <Plus size={24} color={t.colors.primary} />
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
          title="No access to providers"
          subtitle={`${patientName || "This patient"} hasn't granted you access to manage their providers. Ask them to update your permissions from their account settings.`}
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

  if (providers.length === 0) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <EmptyState
          icon={<Stethoscope size={32} color={t.colors.primary} />}
          iconBg={t.colors.primaryBg}
          title="No providers yet"
          subtitle={`Add ${firstName}'s hospitals, clinics, and insurers to keep their health records connected.`}
          actions={
            isEditor
              ? [
                  {
                    label: "Add Provider",
                    icon: <Plus size={16} color="#FFFFFF" />,
                    onPress: () => nav.navigate("PdaAddProvider"),
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
        {isEditor ? <Pencil size={16} color={t.colors.primary} /> : <Eye size={16} color={t.colors.primary} />}
        <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
          {isEditor
            ? `Editor access — you can view, add and remove ${firstName}'s providers.`
            : `Viewer access — you can view ${firstName}'s providers but cannot make changes.`}
        </Text>
      </View>

      {providers.map((p) => (
        <Pressable key={p.id} onPress={() => nav.navigate("PdaProviderDetail", { providerId: p.id })}>
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
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={t.type.bodyStrong}>{providerTitle(p)}</Text>
              <Text style={t.type.caption}>{providerSubtitle(p)}</Text>
            </View>
            <ChevronRight size={16} color={t.colors.textSecondary} />
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
