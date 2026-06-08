import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Badge } from "@/components/Badge";
import { BarChart } from "@/components/BarChart";
import { useTheme } from "@/theme/ThemeProvider";
import { fetchGlucoseSeries, type MetricRange, type MetricSeries } from "@/lib/healthkit";
import { ExpandedShell, TabSelector } from "./_ExpandedShell";

function glucoseBadge(avg: number | null): { label: string; tone: "good" | "warn" } {
  if (avg === null) return { label: "No data", tone: "warn" };
  if (avg < 70) return { label: "Low", tone: "warn" };
  if (avg > 140) return { label: "Elevated", tone: "warn" };
  return { label: "Optimal", tone: "good" };
}

export default function GlucoseExpanded() {
  const t = useTheme();
  const [range, setRange] = useState<MetricRange>("today");
  const [series, setSeries] = useState<MetricSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchGlucoseSeries(range).then((s) => {
      setSeries(s);
      setLoading(false);
    });
  }, [range]);

  const avg = series?.summary.primary ?? null;
  const badge = glucoseBadge(avg);

  return (
    <ExpandedShell
      focus="glucose"
      expandedCard={
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={t.type.h1}>{avg !== null ? avg : "--"}</Text>
            <Text style={t.type.caption}>mg/dL</Text>
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
            <BarChart bars={series.bars} selectedIndex={series.selectedIndex} selectedColor={t.colors.accent} />
          ) : (
            <View style={{ height: 120, justifyContent: "center", alignItems: "center" }}>
              <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>No glucose data</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8 }}>
            <Stat label="MIN" value={series?.summary.min !== null && series?.summary.min !== undefined ? String(series.summary.min) : "--"} tone="muted" />
            <Stat label="AVG" value={avg !== null ? String(avg) : "--"} tone="primary" />
            <Stat label="MAX" value={series?.summary.max !== null && series?.summary.max !== undefined ? String(series.summary.max) : "--"} tone="warn" />
          </View>
        </>
      }
    />
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "primary" | "muted" | "warn" }) {
  const t = useTheme();
  const color = tone === "primary" ? t.colors.primary : tone === "warn" ? t.colors.accent : t.colors.textPrimary;
  return (
    <View style={{ alignItems: "center", flex: 1, gap: 2 }}>
      <Text style={[t.type.h3, { color }]}>{value}</Text>
      <Text style={t.type.caption}>{label}</Text>
    </View>
  );
}
