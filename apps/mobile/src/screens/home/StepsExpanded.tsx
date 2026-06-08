import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Footprints } from "lucide-react-native";
import { Badge } from "@/components/Badge";
import { BarChart } from "@/components/BarChart";
import { useTheme } from "@/theme/ThemeProvider";
import { fetchStepsSeries, type MetricRange, type MetricSeries } from "@/lib/healthkit";
import { ExpandedShell, TabSelector } from "./_ExpandedShell";

const STEP_GOAL = 10000;

function pctOfGoal(steps: number): string {
  return `${Math.round((steps / STEP_GOAL) * 100)}% of goal`;
}

export default function StepsExpanded() {
  const t = useTheme();
  const [range, setRange] = useState<MetricRange>("today");
  const [series, setSeries] = useState<MetricSeries | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchStepsSeries(range).then((s) => {
      setSeries(s);
      setLoading(false);
    });
  }, [range]);

  // Headline: today's total for "today" tab; avg-per-day for week/month.
  const headline = (() => {
    if (!series) return null;
    if (range === "today") return series.bars.reduce((a, b) => a + b, 0);
    return series.summary.primary;
  })();

  return (
    <ExpandedShell
      focus="steps"
      expandedCard={
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={t.type.h1}>{headline !== null && headline > 0 ? headline.toLocaleString() : "--"}</Text>
            <Text style={t.type.caption}>steps</Text>
            {headline !== null && headline > 0 ? (
              <View style={{ marginLeft: 4 }}>
                <Badge label={pctOfGoal(headline)} variant="accent" />
              </View>
            ) : null}
          </View>
          <TabSelector value={range} onChange={setRange} />
          {loading ? (
            <View style={{ height: 120, justifyContent: "center" }}>
              <ActivityIndicator color={t.colors.primary} />
            </View>
          ) : series && series.bars.length > 0 ? (
            <>
              <BarChart bars={series.bars} selectedIndex={series.selectedIndex} />
              <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 4 }}>
                {series.labels.map((d, i) => (
                  <Text
                    key={`${d}-${i}`}
                    style={[t.type.caption, { fontWeight: i === series.selectedIndex ? "600" : "400", flex: 1, textAlign: "center" }]}
                  >
                    {d}
                  </Text>
                ))}
              </View>
            </>
          ) : (
            <View style={{ height: 120, justifyContent: "center", alignItems: "center" }}>
              <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>No steps data</Text>
            </View>
          )}
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8 }}>
            <Stat label="Goal" value={STEP_GOAL.toLocaleString()} icon={<Footprints size={14} color={t.colors.textSecondary} />} />
            <Stat label="Min" value={series?.summary.min !== null && series?.summary.min !== undefined ? series.summary.min.toLocaleString() : "--"} icon={null} />
            <Stat label="Max" value={series?.summary.max !== null && series?.summary.max !== undefined ? series.summary.max.toLocaleString() : "--"} icon={null} />
          </View>
        </>
      }
    />
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", flex: 1, gap: 4 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        {icon}
        <Text style={t.type.caption}>{label}</Text>
      </View>
      <Text style={t.type.h3}>{value}</Text>
    </View>
  );
}
