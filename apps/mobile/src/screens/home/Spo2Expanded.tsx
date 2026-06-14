import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Badge } from "@/components/Badge";
import { BarChart } from "@/components/BarChart";
import { ChartLabels } from "@/components/ChartLabels";
import { useTheme } from "@/theme/ThemeProvider";
import { fetchSpo2Series, type MetricRange, type MetricSeries } from "@/lib/healthkit";
import { spo2Status } from "@/lib/metricStatus";
import { ExpandedShell, TabSelector } from "./_ExpandedShell";

export default function Spo2Expanded() {
  const t = useTheme();
  const [range, setRange] = useState<MetricRange>("today");
  const [series, setSeries] = useState<MetricSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSpo2Series(range).then((s) => {
      setSeries(s);
      setLoading(false);
    });
  }, [range]);

  const avg = series?.summary.primary ?? null;
  const badge = spo2Status(avg);
  const barCaption = range === "today" ? "Average % per 2-hour block" : "Average % per day";

  return (
    <ExpandedShell
      focus="spo2"
      expandedCard={
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={t.type.h1}>{avg !== null ? avg : "--"}</Text>
            <Text style={t.type.caption}>%</Text>
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
            <>
              <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>{barCaption}</Text>
              <BarChart bars={series.bars} selectedIndex={series.selectedIndex} />
              <ChartLabels labels={series.labels} selectedIndex={series.selectedIndex} />
            </>
          ) : (
            <View style={{ height: 120, justifyContent: "center", alignItems: "center" }}>
              <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>No SpO2 data</Text>
            </View>
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

function Stat({ label, value, tone }: { label: string; value: string; tone: "primary" | "muted" }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1, gap: 2 }}>
      <Text style={[t.type.h3, { color: tone === "primary" ? t.colors.primary : t.colors.textPrimary }]}>{value}</Text>
      <Text style={t.type.caption}>{label}</Text>
    </View>
  );
}
