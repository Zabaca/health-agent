import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, UserCheck, Stethoscope } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import { listRepresentingProviders, type UserProvider } from "@/lib/api";
import type { PdaReleasesParamList } from "@/navigation/types";
import { PdaWizardShell } from "./_PdaWizardShell";
import { usePdaWizard } from "./_PdaWizardContext";
import { PdaQuickAddProviderDrawer } from "./_PdaQuickAddProviderDrawer";

type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

function displayName(p: UserProvider): string {
  return p.providerType === "Insurance" ? (p.insurance ?? p.providerName) : p.providerName;
}

function displaySubtitle(p: UserProvider): string {
  if (p.providerType === "Insurance") return `Insurance · ${p.planName ?? p.providerName}`;
  if (p.physicianName) return `${p.providerType} · ${p.providerName}`;
  return p.providerType;
}

export default function PdaWizardStep1() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { currentPatient } = useRepresentedPatients();
  const { wizard, setWizard } = usePdaWizard();

  const [providers, setProviders] = useState<UserProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    if (!currentPatient) return;
    try {
      const list = await listRepresentingProviders(currentPatient.patientId);
      setProviders(list);
      setSelected((prev) => prev ?? list[0]?.id ?? null);
    } catch {
      // keep existing state
    } finally {
      setLoading(false);
    }
  }, [currentPatient]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleNext = () => {
    const provider = providers.find((p) => p.id === selected);
    if (!provider) return;
    setWizard((prev) => ({ ...prev, provider }));
    if (wizard.isEditing) {
      nav.navigate("PdaWizardStep4");
    } else {
      nav.navigate("PdaWizardStep2", {
        providerType: provider.providerType,
        providerId: provider.id,
      });
    }
  };

  const handleProviderSaved = useCallback(async () => {
    setDrawerOpen(false);
    if (!currentPatient) return;
    try {
      const list = await listRepresentingProviders(currentPatient.patientId);
      setProviders(list);
      // select the last added provider
      if (list.length > 0) setSelected(list[list.length - 1].id);
    } catch {
      // keep existing
    }
  }, [currentPatient]);

  return (
    <>
      <PdaWizardShell
        step={1}
        subtitle="Select Provider"
        primaryLabel="Next →"
        primaryDisabled={!selected}
        primaryTestID="pda-wizard-step1-next"
        onPrimary={handleNext}
      >
        <View
          style={{
            backgroundColor: t.colors.primaryBg,
            borderRadius: t.radius.card,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <UserCheck size={24} color={t.colors.primary} style={{ flexShrink: 0 }} />
          <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
            You are automatically set as the representative for this release.
          </Text>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: "center" }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : providers.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 32, gap: 12 }}>
            <Stethoscope size={32} color={t.colors.textSecondary} />
            <Text style={t.type.caption}>No providers yet. Add one to get started.</Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: t.colors.surface,
              borderRadius: t.radius.card,
              borderWidth: 1,
              borderColor: t.colors.border,
              overflow: "hidden",
            }}
          >
            {providers.map((p, i) => {
              const on = p.id === selected;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setSelected(p.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    borderTopWidth: i === 0 ? 0 : 1,
                    borderTopColor: t.colors.divider,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={t.type.bodyStrong}>{displayName(p)}</Text>
                    <Text style={t.type.caption}>{displaySubtitle(p)}</Text>
                  </View>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      borderWidth: 1.5,
                      borderColor: on ? t.colors.primary : t.colors.borderMuted,
                      backgroundColor: on ? t.colors.primary : "transparent",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {on ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF" }} /> : null}
                  </View>
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setDrawerOpen(true)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderTopWidth: 1,
                borderTopColor: t.colors.divider,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: t.colors.primaryBg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={14} color={t.colors.primary} />
              </View>
              <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Add a new provider</Text>
            </Pressable>
          </View>
        )}

        {providers.length === 0 && (
          <Pressable
            onPress={() => setDrawerOpen(true)}
            style={{
              backgroundColor: t.colors.primaryBg,
              borderRadius: t.radius.card,
              borderWidth: 1,
              borderColor: t.colors.primary,
              paddingVertical: 14,
              paddingHorizontal: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Plus size={16} color={t.colors.primary} />
            <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Add a provider</Text>
          </Pressable>
        )}
      </PdaWizardShell>

      {currentPatient && (
        <PdaQuickAddProviderDrawer
          patientId={currentPatient.patientId}
          visible={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onSaved={handleProviderSaved}
        />
      )}
    </>
  );
}
