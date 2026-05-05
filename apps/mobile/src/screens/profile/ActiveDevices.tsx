import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { listSessions, revokeSession, type ActiveSession } from "@/lib/api";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

function formatRelative(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  return `${Math.floor(ms / 86_400_000)}d ago`;
}

function formatLocation(row: ActiveSession): string {
  if (row.city && row.country) return `${row.city}, ${row.country}`;
  if (row.country) return row.country;
  if (row.ip && row.ip !== "::1" && row.ip !== "127.0.0.1") return row.ip;
  return "Unknown location";
}

export default function ActiveDevices() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { signOut } = useAuth();
  const [rows, setRows] = useState<ActiveSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await listSessions();
      setRows(data.sessions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sessions");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRevoke = async (id: string) => {
    setRevokingId(id);
    setError(null);
    try {
      const res = await revokeSession(id);
      if (res.revokedSelf) {
        await signOut();
        return;
      }
      setRows((prev) => prev?.filter((r) => r.id !== id) ?? prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revoke session");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Active Devices" onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ gap: 12 }}>
        <Text style={t.type.caption}>
          Devices currently signed in to your account. If you don&apos;t recognize one, sign it out.
        </Text>

        {error ? (
          <View
            style={{
              backgroundColor: t.colors.surface,
              borderRadius: t.radius.card,
              borderWidth: 1,
              borderColor: t.colors.destructive,
              padding: 12,
            }}
          >
            <Text style={{ color: t.colors.destructive }}>{error}</Text>
          </View>
        ) : null}

        {rows === null ? (
          <ActivityIndicator color={t.colors.primary} />
        ) : rows.length === 0 ? (
          <Text style={t.type.caption}>No active sessions.</Text>
        ) : (
          rows.map((row) => (
            <View
              key={row.id}
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
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Text style={t.type.bodyStrong}>{row.deviceName ?? "Unknown device"}</Text>
                  <View
                    style={{
                      backgroundColor: t.colors.primaryBg,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 6,
                    }}
                  >
                    <Text style={{ color: t.colors.primary, fontSize: 11, fontWeight: "600" }}>
                      {row.platform}
                    </Text>
                  </View>
                  {row.isCurrent ? (
                    <View
                      style={{
                        backgroundColor: t.colors.primary,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 6,
                      }}
                    >
                      <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>This device</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={t.type.caption}>
                  {formatLocation(row)} · last active {formatRelative(row.lastSeenAt)}
                </Text>
              </View>
              <Pressable
                onPress={() => onRevoke(row.id)}
                disabled={revokingId === row.id}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: row.isCurrent ? t.colors.destructive : t.colors.surface,
                  borderWidth: row.isCurrent ? 0 : 1,
                  borderColor: t.colors.destructive,
                  opacity: revokingId === row.id ? 0.5 : 1,
                }}
              >
                <Text
                  style={{
                    color: row.isCurrent ? "#FFFFFF" : t.colors.destructive,
                    fontWeight: "600",
                    fontSize: 13,
                  }}
                >
                  {row.isCurrent ? "Sign out" : "Revoke"}
                </Text>
              </Pressable>
            </View>
          ))
        )}
      </Screen>
    </View>
  );
}
