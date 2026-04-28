import { Text, View } from "react-native";
import { Badge } from "@/components/Badge";
import { BarChart } from "@/components/BarChart";
import { useTheme } from "@/theme/ThemeProvider";
import { heartRateChart } from "@/mock/health";
import { ExpandedShell, TabSelector } from "./_ExpandedShell";

export default function CardExpanded() {
  const t = useTheme();
  return (
    <ExpandedShell
      focus="heartRate"
      expandedCard={
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={t.type.h1}>72</Text>
            <Text style={t.type.caption}>bpm</Text>
            <View style={{ marginLeft: 4 }}>
              <Badge label="Normal" variant="success" />
            </View>
          </View>
          <TabSelector />
          <BarChart bars={heartRateChart.bars} selectedIndex={heartRateChart.selected} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8 }}>
            <Stat label="MIN" value={String(heartRateChart.min)} tone="muted" />
            <Stat label="AVG" value={String(heartRateChart.avg)} tone="primary" />
            <Stat label="MAX" value={String(heartRateChart.max)} tone="muted" />
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
