import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Badge } from "@/components/Badge";
import { StackedBarChart } from "@/components/StackedBarChart";
import { useTheme } from "@/theme/ThemeProvider";
import { fetchSleepSeries, type MetricRange, type SleepSeries } from "@/lib/healthkit";
import { ChartLabels } from "@/components/ChartLabels";
import { sleepStatus } from "@/lib/metricStatus";
import { ExpandedShell, TabSelector } from "./_ExpandedShell";

// Dark → light green ramp for the stacked sleep stages (Deep at the bottom).
const STAGE_COLORS = { deep: "#2C6B45", core: "#5FA77D", rem: "#A7CDB8" } as const;

function fmtHm(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h ${m}m`;
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
  const badge = sleepStatus(asleep);
  const barCaption = range === "today" ? "Time asleep last night" : "Hours asleep per day";

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
            <>
              <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>{barCaption}</Text>
              <StackedBarChart
                bars={series.stageBars.map((s) => [
                  { value: s.deepMin, color: STAGE_COLORS.deep },
                  { value: s.coreMin, color: STAGE_COLORS.core },
                  { value: s.remMin, color: STAGE_COLORS.rem },
                ])}
                selectedIndex={series.selectedIndex}
              />
              <ChartLabels labels={series.labels} selectedIndex={series.selectedIndex} />
              <StageLegend />
            </>
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

function StageLegend() {
  const t = useTheme();
  const items = [
    { label: "Deep", color: STAGE_COLORS.deep },
    { label: "Core", color: STAGE_COLORS.core },
    { label: "REM", color: STAGE_COLORS.rem },
  ];
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 16, paddingTop: 4 }}>
      {items.map((it) => (
        <View key={it.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: it.color }} />
          <Text style={t.type.caption}>{it.label}</Text>
        </View>
      ))}
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
