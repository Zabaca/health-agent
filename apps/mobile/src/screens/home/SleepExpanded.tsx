import { Text, View } from "react-native";
import { Badge } from "@/components/Badge";
import { BarChart } from "@/components/BarChart";
import { useTheme } from "@/theme/ThemeProvider";
import { sleepChart } from "@/mock/health";
import { ExpandedShell, TabSelector } from "./_ExpandedShell";

export default function SleepExpanded() {
  const t = useTheme();
  return (
    <ExpandedShell
      focus="sleep"
      expandedCard={
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}>
            <Text style={t.type.h1}>{sleepChart.total}</Text>
            <Badge label="Good" variant="success" />
          </View>
          <TabSelector />
          <BarChart bars={sleepChart.bars} selectedIndex={sleepChart.selected} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8 }}>
            <Stat label="TOTAL" value={sleepChart.total} tone="muted" />
            <Stat label="DEEP" value={sleepChart.deep} tone="primary" />
            <Stat label="REM" value={sleepChart.rem} tone="muted" />
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
