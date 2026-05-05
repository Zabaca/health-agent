import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, UserCheck } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import { listRepresentingProviders, type UserProvider } from "@/lib/api";
import type { PdaReleasesParamList } from "@/navigation/types";
import { PdaWizardShell } from "./_PdaWizardShell";

type Nav = NativeStackNavigationProp<PdaReleasesParamList>;

function providerTitle(p: UserProvider) {
  return p.physicianName ?? p.providerName;
}

function providerSubtitle(p: UserProvider) {
  if (p.physicianName) return `${p.providerType} · ${p.providerName}`;
  return p.providerType;
}

export default function PdaWizardStep1() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { currentPatient } = useRepresentedPatients();

  const [providers, setProviders] = useState<UserProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!currentPatient) return;
    listRepresentingProviders(currentPatient.patientId)
      .then((list) => {
        setProviders(list);
        if (list.length > 0) setSelected(list[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentPatient]);

  return (
    <PdaWizardShell
      step={1}
      subtitle="Select Provider"
      variant="close"
      primaryLabel="Next — Record Types"
      onPrimary={() => nav.navigate("PdaWizardStep2")}
    >
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
        <UserCheck size={16} color={t.colors.primary} />
        <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
          You will be automatically set as the representative for this release.
        </Text>
      </View>

      {loading ? (
        <View style={{ paddingVertical: 24, alignItems: "center" }}>
          <ActivityIndicator color={t.colors.primary} />
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
                  <Text style={t.type.bodyStrong}>{providerTitle(p)}</Text>
                  <Text style={t.type.caption}>{providerSubtitle(p)}</Text>
                </View>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 1.5,
                    borderColor: on ? t.colors.primary : t.colors.borderMuted,
                    backgroundColor: on ? t.colors.primary : "transparent",
                  }}
                >
                  {on ? (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF", margin: 6 }} />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
          {providers.length === 0 ? (
            <View style={{ paddingHorizontal: 14, paddingVertical: 18, alignItems: "center" }}>
              <Text style={t.type.caption}>No providers found. Add a provider first.</Text>
            </View>
          ) : null}
          <Pressable
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
    </PdaWizardShell>
  );
}
