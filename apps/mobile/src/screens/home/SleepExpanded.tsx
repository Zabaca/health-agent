import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Badge } from "@/components/Badge";
import { BarChart } from "@/components/BarChart";
import { useTheme } from "@/theme/ThemeProvider";
import { fetchSleepSeries, type MetricRange, type SleepSeries } from "@/lib/healthkit";
import { ExpandedShell, TabSelector } from "./_ExpandedShell";

function fmtHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${m}m`;
}

function sleepBadge(asleepMin: number): { label: string; tone: "good" | "warn" } {
  if (asleepMin === 0) return { label: "No data", tone: "warn" };
  if (asleepMin < 360) return { label: "Short", tone: "warn" };
  if (asleepMin > 540) return { label: "Long", tone: "warn" };
  return { label: "Good", tone: "good" };
}

export default function SleepExpanded() {
  const t = useTheme();
  const [range, setRange] = useState<MetricRange>("today");
  const [series, setSeries] = useState<SleepSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchSleepSeries(range).then((s) => {
      setSeries(s);
      setLoading(false);
    });
  }, [range]);

  const asleep = series?.stages.asleepMin ?? 0;
  const badge = sleepBadge(asleep);

  return (
    <ExpandedShell
      focus="sleep"
      expandedCard={
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}>
            <Text style={t.type.h1}>{asleep > 0 ? fmtHm(asleep) : "--"}</Text>
            <Badge label={badge.label} variant={badge.tone === "good" ? "success" : "accent"} />
          </View>
          <TabSelector value={range} onChange={setRange} />
          {loading ? (
            <View style={{ height: 120, justifyContent: "center" }}>
              <ActivityIndicator color={t.colors.primary} />
            </View>
          ) : series && series.bars.length > 0 && asleep > 0 ? (
            <BarChart bars={series.bars} selectedIndex={series.selectedIndex} />
          ) : (
            <View style={{ height: 120, justifyContent: "center", alignItems: "center" }}>
              <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>No sleep data</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8 }}>
            <Stat label="TOTAL" value={asleep > 0 ? fmtHm(asleep) : "--"} tone="muted" />
            <Stat label="DEEP" value={series && series.stages.deepMin > 0 ? fmtHm(series.stages.deepMin) : "--"} tone="primary" />
            <Stat label="REM" value={series && series.stages.remMin > 0 ? fmtHm(series.stages.remMin) : "--"} tone="muted" />
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
