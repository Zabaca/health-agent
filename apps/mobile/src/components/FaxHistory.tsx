import { Text, View } from "react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { Badge } from "@/components/Badge";
import type { ReleaseFaxLog } from "@/lib/api";

function statusBadge(log: ReleaseFaxLog): { label: string; variant: "success" | "accent" | "destructive" } {
  if (log.error || log.status === "failed") return { label: "Failed", variant: "destructive" };
  if (log.status === "awaiting_confirmation") return { label: "Queued", variant: "accent" };
  return { label: "Sent", variant: "success" };
}

function formatSentAt(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Fax-send history for a release. Renders nothing unless at least one fax
 * attempt has been made. Statuses update a few minutes after sending when the
 * provider's fax confirmation arrives, so this reflects delivery, not just send.
 */
export function FaxHistory({ logs }: { logs: ReleaseFaxLog[] | undefined }) {
  const t = useTheme();
  if (!logs || logs.length === 0) return null;

  return (
    <View style={{ gap: 8 }}>
      <Text style={t.type.bodyStrong}>Fax History</Text>
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          overflow: "hidden",
        }}
      >
        {logs.map((log, i) => {
          const badge = statusBadge(log);
          return (
            <View
              key={log.id}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
                gap: 4,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <Text style={[t.type.body, { fontWeight: "600", flex: 1 }]} numberOfLines={1}>
                  {log.recipientName || "Medical Records"}
                </Text>
                <Badge label={badge.label} variant={badge.variant} />
              </View>
              <Text style={t.type.caption}>
                {(log.faxNumber ?? "—")} · {formatSentAt(log.createdAt)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
