import { Text, View } from "react-native";
import { Badge } from "@/components/Badge";
import { BarChart } from "@/components/BarChart";
import { useTheme } from "@/theme/ThemeProvider";
import { glucoseChart } from "@/mock/health";
import { ExpandedShell, TabSelector } from "./_ExpandedShell";

export default function GlucoseExpanded() {
  const t = useTheme();
  return (
    <ExpandedShell
      focus="glucose"
      expandedCard={
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={t.type.h1}>{glucoseChart.avg}</Text>
            <Text style={t.type.caption}>mg/dL</Text>
            <View style={{ marginLeft: 4 }}>
              <Badge label="Optimal" variant="success" />
            </View>
          </View>
          <TabSelector />
          <BarChart bars={glucoseChart.bars} selectedIndex={glucoseChart.selected} selectedColor={t.colors.accent} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8 }}>
            <Stat label="MIN" value={String(glucoseChart.min)} tone="muted" />
            <Stat label="AVG" value={String(glucoseChart.avg)} tone="primary" />
            <Stat label="MAX" value={String(glucoseChart.max)} tone="warn" />
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
