import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronLeft, User } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import type { RecordsParamList } from "@/navigation/types";
import type { RecordItem } from "@/mock/records";

type Nav = NativeStackNavigationProp<RecordsParamList>;

export function DetailShell({
  record,
  children,
  badgeVariant = "success",
}: {
  record: RecordItem;
  badgeVariant?: "success" | "muted" | "accent" | "destructive";
  children: React.ReactNode;
}) {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [deleteOpen, setDeleteOpen] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <View style={{ paddingHorizontal: t.spacing.gutter, paddingTop: insets.top + 12 }}>
        <Pressable onPress={() => nav.goBack()} style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <ChevronLeft size={18} color={t.colors.primary} />
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>My Records</Text>
        </Pressable>
      </View>
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Button label="Delete Record" variant="destructive" onPress={() => setDeleteOpen(true)} fullWidth />
          </View>
        }
        contentContainerStyle={{ gap: 12 }}
      >
        <View style={{ gap: 6, marginTop: 4 }}>
          <Text style={t.type.h2}>{record.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <Badge label={record.kind === "labs" ? "Labs" : record.kind === "imaging" ? "Imaging" : "Notes"} variant={badgeVariant} />
            <Text style={t.type.caption}>{record.date} · {record.provider}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
            <User size={14} color={t.colors.textSecondary} />
            <Text style={t.type.caption}>{record.kind === "notes" ? record.orderedBy : `Ordered by ${record.orderedBy}`}</Text>
          </View>
        </View>
        {children}
      </Screen>

      <ConfirmDrawer
        visible={deleteOpen}
        title="Delete this record?"
        message={`"${record.title}" will be removed from your health records. This can't be undone.`}
        confirmLabel="Delete Record"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => { setDeleteOpen(false); nav.goBack(); }}
      />
    </View>
  );
}

export function SectionHeader({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text style={[t.type.sectionLabel, { textTransform: "uppercase", marginTop: 8 }]}>{children}</Text>
  );
}
