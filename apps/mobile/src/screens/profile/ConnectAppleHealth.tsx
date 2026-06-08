import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Activity, Moon, FlaskConical, Footprints, Heart } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import { requestHealthKitAccess, fetchTodayMetrics, fetchClinicalRecords, recordHealthSync, getLastHealthSync, clearHealthSync } from "@/lib/healthkit";
import { patchProfile, postHealthData, postClinicalRecords, getSetupStatus, getHealthData, getClinicalRecordSummary, type HealthDataRow, type ClinicalRecordSummary } from "@/lib/api";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

// Each card row maps a user-facing category to (a) the HealthData `type`s it
// covers (from `/api/health-data`) and (b) HealthKit clinical recordTypes from
// `/api/clinical-records`. A category is "synced" if either source has data.
const CATEGORIES: Array<{
  id: string;
  label: string;
  Icon: typeof Activity;
  types: string[];
  fhirRecordTypes?: string[];
}> = [
  { id: "vitals", label: "Heart Rate & Vitals", Icon: Activity, types: ["heartRateAvg", "heartRateMin", "heartRateMax"], fhirRecordTypes: ["VitalSignRecord"] },
  { id: "sleep", label: "Sleep Analysis", Icon: Moon, types: ["sleepMinutes"] },
  { id: "labs", label: "Lab Results", Icon: FlaskConical, types: [], fhirRecordTypes: ["LabResultRecord"] },
  { id: "steps", label: "Steps & Activity", Icon: Footprints, types: ["steps"] },
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function dateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return dateStr(d);
}
function timeAgo(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

type Props = { onConnected?: () => void };

export default function ConnectAppleHealth({ onConnected }: Props) {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [loading, setLoading] = useState(false);
  // null = still checking connection status
  const [connected, setConnected] = useState<boolean | null>(null);
  const [rows, setRows] = useState<HealthDataRow[]>([]);
  const [clinical, setClinical] = useState<ClinicalRecordSummary | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      getSetupStatus()
        .then((s) => {
          setConnected(s.healthKitConnected);
          if (s.healthKitConnected) {
            getHealthData({ from: daysAgo(30), to: dateStr(new Date()) })
              .then(setRows)
              .catch(() => {});
            getClinicalRecordSummary()
              .then(setClinical)
              .catch(() => {});
            getLastHealthSync().then(setLastSync).catch(() => {});
          }
        })
        .catch(() => setConnected(false));
    }, []),
  );

  async function handleConnect() {
    setLoading(true);
    try {
      const granted = await requestHealthKitAccess();
      if (!granted) {
        // Resolves false on non-iOS (Android/web) — don't flag the account connected.
        Alert.alert("Not available", "Apple Health is only available on iOS devices.");
        return;
      }
      const metrics = await fetchTodayMetrics();
      await Promise.all([
        patchProfile({ healthKitConnected: true }),
        metrics.length > 0 ? postHealthData(metrics) : Promise.resolve(),
      ]);
      await recordHealthSync();
      // FHIR clinical records (foreground, one-time on connect). No-op until
      // clinical access is enabled (capability + permissions); errors are non-fatal.
      try {
        const clinical = await fetchClinicalRecords();
        // Server caps at 500/request; chunk so a chronic patient's full history persists.
        for (let i = 0; i < clinical.length; i += 500) {
          await postClinicalRecords(clinical.slice(i, i + 500));
        }
      } catch {
        // ignore — clinical access may not be granted/enabled
      }
      onConnected?.();
      nav.goBack();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to connect to Apple Health.";
      Alert.alert("Connection failed", msg);
    } finally {
      setLoading(false);
    }
  }

  function handleDisconnect() {
    Alert.alert(
      "Disconnect Apple Health",
      "Veladon will stop syncing new data from Apple Health. Previously synced data is kept. To fully revoke access, use the Health app's settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            try {
              await patchProfile({ healthKitConnected: false });
              await clearHealthSync();
              nav.goBack();
            } catch {
              Alert.alert("Error", "Could not disconnect. Please try again.");
            }
          },
        },
      ],
    );
  }

  function syncStatus(types: string[], fhirRecordTypes?: string[]): string {
    // FHIR count for this category — pull from the clinical-records summary.
    const fhirCount = fhirRecordTypes && clinical
      ? fhirRecordTypes.reduce((sum, rt) => sum + (clinical.counts[rt] ?? 0), 0)
      : 0;
    const matching = rows.filter((r) => types.includes(r.type));
    if (fhirCount > 0) {
      const label = fhirCount === 1 ? "1 result" : `${fhirCount} results`;
      if (clinical?.latestUpdatedAt) return `${label} · synced ${timeAgo(clinical.latestUpdatedAt)}`;
      return label;
    }
    if (matching.length > 0) {
      const latest = matching.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
      return `Updated ${timeAgo(latest.updatedAt)}`;
    }
    // No data for this category: distinguish "synced, nothing here" from "never synced".
    return lastSync ? "No data" : "Not synced yet";
  }

  // ── Still resolving connection status ──
  if (connected === null) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <Header onBack={() => nav.goBack()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      </View>
    );
  }

  // ── Connected: management view (data sources + sync status + disconnect) ──
  if (connected) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <Header onBack={() => nav.goBack()} />
        <Screen contentContainerStyle={{ gap: 18, paddingTop: 32, alignItems: "stretch" }}>
          <View style={{ alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: t.colors.primaryBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Heart size={28} color={t.colors.primary} />
            </View>
            <Text style={t.type.h2}>Apple Health</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary }} />
              <Text style={[t.type.caption, { color: t.colors.primary, fontWeight: "600" }]}>
                Connected · syncing automatically
              </Text>
            </View>
            <Text style={t.type.caption}>
              {lastSync ? `Last synced ${timeAgo(lastSync)}` : "Waiting for first sync…"}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: t.colors.surface,
              borderRadius: t.radius.card,
              borderWidth: 1,
              borderColor: t.colors.border,
              overflow: "hidden",
            }}
          >
            {CATEGORIES.map((c, i) => (
              <View
                key={c.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: t.colors.divider,
                }}
              >
                <c.Icon size={18} color={t.colors.primary} />
                <Text style={[t.type.body, { flex: 1 }]}>{c.label}</Text>
                <Text style={t.type.caption}>{syncStatus(c.types, c.fhirRecordTypes)}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleDisconnect}
            style={{
              height: 52,
              borderRadius: t.radius.button,
              borderWidth: 1,
              borderColor: t.colors.destructive,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: t.colors.destructive, fontWeight: "700", fontSize: 16 }}>
              Disconnect Apple Health
            </Text>
          </Pressable>
        </Screen>
      </View>
    );
  }

  // ── Not connected: connect / onboarding view ──
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ gap: 18, paddingTop: 32, alignItems: "stretch" }}>
        <View style={{ alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: t.colors.surface,
              borderWidth: 1,
              borderColor: t.colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Heart size={28} color={t.colors.destructive} />
          </View>
          <Text style={t.type.h2}>Connect Apple Health</Text>
          <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 16 }]}>
            Sync your vitals, labs, sleep, and activity data automatically.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.border,
            overflow: "hidden",
          }}
        >
          {CATEGORIES.map((c, i) => (
            <View
              key={c.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              <c.Icon size={18} color={t.colors.primary} />
              <Text style={t.type.body}>{c.label}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleConnect}
          disabled={loading}
          style={{
            height: 52,
            borderRadius: t.radius.button,
            backgroundColor: t.colors.primary,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Heart size={16} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Connect Apple Health</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={() => nav.goBack()} style={{ alignItems: "center", padding: 8 }}>
          <Text style={t.type.caption}>Skip for now</Text>
        </Pressable>
      </Screen>
    </View>
  );
}
