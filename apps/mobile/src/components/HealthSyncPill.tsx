import { Pressable, Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useTheme } from "@/theme/ThemeProvider";
import { getLastHealthSync } from "@/lib/healthkit";

type Props = {
  connected: boolean;
  syncing?: boolean;
  /** When provided, takes precedence over the value read from storage. */
  lastSynced?: Date | null;
  onPressDisconnected?: () => void;
};

function formatSync(lastSynced: Date | null, syncing: boolean): string | null {
  if (syncing) return "Syncing…";
  if (!lastSynced) return null;
  const diffMin = Math.round((Date.now() - lastSynced.getTime()) / 60000);
  if (diffMin < 1) return "Synced just now";
  if (diffMin === 1) return "Synced 1 min ago";
  if (diffMin < 60) return `Synced ${diffMin} min ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr === 1) return "Synced 1 hr ago";
  return `Synced ${diffHr} hr ago`;
}

export function HealthSyncPill({ connected, syncing = false, lastSynced, onPressDisconnected }: Props) {
  const t = useTheme();
  const [storedSync, setStoredSync] = useState<Date | null>(null);

  useEffect(() => {
    if (lastSynced !== undefined) return;
    getLastHealthSync().then((iso) => {
      if (iso) setStoredSync(new Date(iso));
    });
  }, [lastSynced]);

  if (!connected) {
    return (
      <Pressable
        onPress={onPressDisconnected}
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.pill,
          paddingVertical: 8,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          alignSelf: "stretch",
          borderWidth: 1,
          borderColor: t.colors.border,
        }}
      >
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.textSecondary }} />
        <Text style={[t.type.caption, { color: t.colors.textSecondary, fontWeight: "500" }]}>
          Connect Apple Health
        </Text>
      </Pressable>
    );
  }

  const effective = lastSynced !== undefined ? lastSynced : storedSync;
  const label = formatSync(effective, syncing);

  return (
    <View
      style={{
        backgroundColor: t.colors.primaryBg,
        borderRadius: t.radius.pill,
        paddingVertical: 8,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        alignSelf: "stretch",
      }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.primary }} />
      <Text style={[t.type.caption, { color: t.colors.primary, fontWeight: "500" }]}>
        {label ? `Apple Health connected · ${label}` : "Apple Health connected"}
      </Text>
    </View>
  );
}
