import { Text, View } from "react-native";
import { Heart, Moon, Droplet } from "lucide-react-native";
import { Badge } from "@/components/Badge";
import { BarChart } from "@/components/BarChart";
import { useTheme } from "@/theme/ThemeProvider";
import { stepsChart } from "@/mock/health";
import { ExpandedShell, TabSelector } from "./_ExpandedShell";

export default function StepsExpanded() {
  const t = useTheme();
  return (
    <ExpandedShell
      focus="steps"
      expandedCard={
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
            <Text style={t.type.h1}>6,841</Text>
            <Text style={t.type.caption}>steps</Text>
            <View style={{ marginLeft: 4 }}>
              <Badge label="68% of goal" variant="accent" />
            </View>
          </View>
          <TabSelector />
          <BarChart bars={stepsChart.bars} selectedIndex={stepsChart.selected} />
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 4 }}>
            {stepsChart.labels.map((d, i) => (
              <Text key={d} style={[t.type.caption, { fontWeight: i === stepsChart.selected ? "600" : "400" }]}>{d}</Text>
            ))}
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", paddingTop: 8 }}>
            <Stat label="Goal" value={stepsChart.goal} icon={<Heart size={14} color={t.colors.textSecondary} />} />
            <Stat label="Distance" value={stepsChart.distance} icon={<Moon size={14} color={t.colors.textSecondary} />} />
            <Stat label="Active" value={stepsChart.active} icon={<Droplet size={14} color={t.colors.textSecondary} />} />
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
