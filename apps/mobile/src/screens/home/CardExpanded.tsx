import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Badge } from "@/components/Badge";
import { BarChart } from "@/components/BarChart";
import { useTheme } from "@/theme/ThemeProvider";
import { fetchHeartRateSeries, type MetricRange, type MetricSeries } from "@/lib/healthkit";
import { ExpandedShell, TabSelector } from "./_ExpandedShell";

function hrBadge(avg: number | null): { label: string; tone: "good" | "warn" } {
  if (avg === null) return { label: "No data", tone: "warn" };
  if (avg < 60) return { label: "Low", tone: "warn" };
  if (avg > 100) return { label: "Elevated", tone: "warn" };
  return { label: "Normal", tone: "good" };
}

export default function CardExpanded() {
  const t = useTheme();
  const [range, setRange] = useState<MetricRange>("today");
  const [series, setSeries] = useState<MetricSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchHeartRateSeries(range).then((s) => {
      setSeries(s);
      setLoading(false);
    });
  }, [range]);

  const avg = series?.summary.primary ?? null;
  const badge = hrBadge(avg);

  return (
    <ExpandedShell
      focus="heartRate"
      expandedCard={
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={t.type.h1}>{avg !== null ? avg : "--"}</Text>
            <Text style={t.type.caption}>bpm</Text>
            <View style={{ marginLeft: 4 }}>
              <Badge label={badge.label} variant={badge.tone === "good" ? "success" : "accent"} />
            </View>
          </View>
          <TabSelector value={range} onChange={setRange} />
          {loading ? (
            <View style={{ height: 120, justifyContent: "center" }}>
              <ActivityIndicator color={t.colors.primary} />
            </View>
          ) : series && series.bars.length > 0 ? (
            <BarChart bars={series.bars} selectedIndex={series.selectedIndex} />
          ) : (
            <NoData label="No heart rate data" t={t} />
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8 }}>
            <Stat label="MIN" value={series?.summary.min !== null && series?.summary.min !== undefined ? String(series.summary.min) : "--"} tone="muted" />
            <Stat label="AVG" value={avg !== null ? String(avg) : "--"} tone="primary" />
            <Stat label="MAX" value={series?.summary.max !== null && series?.summary.max !== undefined ? String(series.summary.max) : "--"} tone="muted" />
          </View>
        </>
      }
    />
  );
}

function NoData({ label, t }: { label: string; t: ReturnType<typeof useTheme> }) {
  return (
    <View style={{ height: 120, justifyContent: "center", alignItems: "center" }}>
      <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "primary" | "muted" }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1, gap: 2 }}>
      <Text style={[t.type.h3, { color: tone === "primary" ? t.colors.primary : t.colors.textPrimary }]}>{value}</Text>
      <Text style={t.type.caption}>{label}</Text>
    </View>
  );
}
