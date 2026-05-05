import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Search, Check, Plus, Stethoscope } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { listMyProviders, type UserProvider } from "@/lib/api";
import type { ReleasesParamList } from "@/navigation/types";
import { WizardShell } from "./_WizardShell";
import { useWizard } from "./_WizardContext";
import { QuickAddProviderDrawer } from "./_QuickAddProviderDrawer";

type Nav = NativeStackNavigationProp<ReleasesParamList>;

function displayName(p: UserProvider): string {
  return p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName;
}

function subtitle(p: UserProvider): string {
  if (p.providerType === "Insurance") {
    return p.patientMemberId ? `Insurance · Member #${p.patientMemberId}` : "Insurance";
  }
  return p.physicianName ? `${p.providerType} · ${p.physicianName}` : p.providerType;
}

export default function WizardStep1() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { wizard, setWizard } = useWizard();
  const [providers, setProviders] = useState<UserProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [showAddDrawer, setShowAddDrawer] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const list = await listMyProviders();
      setProviders(list);
      if (list.length > 0 && selected === null) setSelected(list[0].id);
    } catch {
      // silently ignore — user sees empty list
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleProviderSaved = useCallback(async () => {
    setShowAddDrawer(false);
    try {
      setLoading(true);
      const list = await listMyProviders();
      setProviders(list);
      if (list.length > 0) setSelected(list[list.length - 1].id);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const selectedProvider = providers.find(p => p.id === selected);

  const handleNext = () => {
    if (!selectedProvider) return;
    setWizard(prev => ({ ...prev, provider: selectedProvider }));
    if (wizard.isEditing) {
      nav.navigate("WizardStep5");
    } else {
      nav.navigate("WizardStep2", {
        providerType: selectedProvider.providerType,
        providerId: selectedProvider.id,
      });
    }
  };

  return (
    <>
      <WizardShell
        step={1}
        subtitle="Select Provider"
        primaryLabel="Next →"
        onPrimary={handleNext}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.button,
            borderWidth: 1,
            borderColor: t.colors.border,
            paddingHorizontal: 14,
            height: 44,
          }}
        >
          <Search size={18} color={t.colors.textSecondary} />
          <Text style={[t.type.body, { color: t.colors.textPlaceholder, flex: 1 }]}>Search providers...</Text>
        </View>

        <Text style={[t.type.sectionLabel, { textTransform: "uppercase" }]}>SAVED PROVIDERS</Text>

        {loading ? (
          <View style={{ paddingVertical: 32, alignItems: "center" }}>
            <ActivityIndicator size="large" color={t.colors.primary} />
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
            {providers.length === 0 ? (
              <View style={{ padding: 32, alignItems: "center", gap: 8 }}>
                <Stethoscope size={32} color={t.colors.textSecondary} />
                <Text style={[t.type.body, { color: t.colors.textSecondary, textAlign: "center" }]}>
                  No saved providers yet. Add one below.
                </Text>
              </View>
            ) : (
              providers.map((p, i) => {
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
                      <Text style={t.type.caption}>{subtitle(p)}</Text>
                    </View>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 1.5,
                        borderColor: on ? t.colors.primary : t.colors.borderMuted,
                        backgroundColor: on ? t.colors.primary : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {on ? <Check size={14} color="#FFFFFF" /> : null}
                    </View>
                  </Pressable>
                );
              })
            )}

            <Pressable
              onPress={() => setShowAddDrawer(true)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderTopWidth: providers.length > 0 ? 1 : 0,
                borderTopColor: t.colors.divider,
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Plus size={18} color={t.colors.primary} />
              <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Add a new provider</Text>
            </Pressable>
          </View>
        )}
      </WizardShell>

      <QuickAddProviderDrawer
        visible={showAddDrawer}
        onClose={() => setShowAddDrawer(false)}
        onSaved={handleProviderSaved}
      />
    </>
  );
}
