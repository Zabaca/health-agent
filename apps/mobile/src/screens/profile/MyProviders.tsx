import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Plus, ChevronRight, Stethoscope } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { ProviderAvatar } from "@/components/ProviderAvatar";
import { useTheme } from "@/theme/ThemeProvider";
import { listMyProviders, type UserProvider } from "@/lib/api";
import type { ProvidersParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProvidersParamList>;

function providerDisplayName(p: UserProvider): string {
  return p.providerType === "Insurance" ? (p.insurance || p.providerName) : p.providerName;
}

function providerSubtitle(p: UserProvider): string {
  if (p.providerType === "Insurance") {
    return p.patientMemberId ? `Member #${p.patientMemberId}` : "Insurance";
  }
  return p.physicianName ? p.physicianName : p.providerType;
}

function providerDetail(p: UserProvider): string | null {
  if (p.providerType === "Insurance") {
    return p.planName || null;
  }
  if (p.phone) return p.phone;
  if (p.address) return p.address.split(",")[0].trim();
  return null;
}

export default function MyProviders() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [providers, setProviders] = useState<UserProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setProviders(await listMyProviders());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load providers");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const empty = !loading && providers.length === 0;

  return (
    <Screen safeTop contentContainerStyle={{ gap: 12, flexGrow: empty ? 1 : undefined }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <Text
          style={[t.type.h1, { flex: 1 }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          My Providers
        </Text>
        <Pressable
          onPress={() => nav.navigate("AddProvider")}
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
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Text style={[t.type.body, { color: t.colors.destructive, textAlign: "center" }]}>{error}</Text>
          <Pressable onPress={load}>
            <Text style={[t.type.body, { color: t.colors.primary }]}>Retry</Text>
          </Pressable>
        </View>
      ) : empty ? (
        <EmptyState
          icon={<Stethoscope size={32} color={t.colors.textSecondary} />}
          title="No providers yet"
          subtitle="Add your hospitals, clinics, and insurers to keep your health records connected."
          actions={[
            {
              label: "Add Provider",
              icon: <Plus size={16} color="#FFFFFF" />,
              onPress: () => nav.navigate("AddProvider"),
            },
          ]}
        />
      ) : (
        providers.map((p) => {
          const detail = providerDetail(p);
          return (
            <Pressable key={p.id} onPress={() => nav.navigate("ProviderDetail", { provider: p })}>
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
                <ProviderAvatar type={p.providerType} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={t.type.bodyStrong} numberOfLines={1}>{providerDisplayName(p)}</Text>
                  <Text style={t.type.caption} numberOfLines={1}>{providerSubtitle(p)}</Text>
                  {detail && (
                    <Text style={[t.type.caption, { marginTop: 2 }]} numberOfLines={1}>{detail}</Text>
                  )}
                </View>
                <ChevronRight size={18} color={t.colors.textSecondary} />
              </View>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
