import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Download, FileText, Info } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { ConfirmDrawer } from "@/components/ConfirmDrawer";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { findPatient } from "@/mock/pda";
import { mockRecords } from "@/mock/records";
import type { PdaRecordsParamList } from "@/navigation/types";

type R = RouteProp<PdaRecordsParamList, "PdaRecordDetail">;
type Nav = NativeStackNavigationProp<PdaRecordsParamList>;

export default function PdaRecordDetail() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { params } = useRoute<R>();
  const { representing } = useRole();
  const patient = findPatient(representing);
  const record = mockRecords.find((r) => r.id === params.recordId) ?? mockRecords[0];
  const [deleteOpen, setDeleteOpen] = useState(false);

  const rows = [
    { label: "Type", value: record.kind === "labs" ? "Labs" : record.kind === "imaging" ? "Imaging" : "Notes" },
    { label: "Provider", value: record.provider },
    { label: "Date", value: record.date },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header
        title={record.title}
        onBack={() => nav.goBack()}
        rightAction={{ icon: <Download size={20} color={t.colors.primary} />, onPress: () => {} }}
      />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Pressable
              onPress={() => setDeleteOpen(true)}
              style={{ height: 52, borderRadius: t.radius.button, backgroundColor: t.colors.destructive, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Delete Record</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.border,
            overflow: "hidden",
          }}
        >
          {rows.map((row, i) => (
            <View
              key={row.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              <Text style={[t.type.caption, { flex: 1 }]}>{row.label}</Text>
              <Text style={[t.type.body, { fontWeight: "600" }]}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View
          style={{
            backgroundColor: t.colors.primaryBg,
            borderRadius: t.radius.card,
            padding: 18,
            alignItems: "center",
            gap: 10,
          }}
        >
          <FileText size={28} color={t.colors.primary} />
          <Text style={{ color: t.colors.primary, fontWeight: "600" }}>
            {record.title.replace(/[^A-Za-z]/g, "_")}.pdf
          </Text>
        </View>

        <View
          style={{
            backgroundColor: t.colors.primaryBg,
            borderRadius: t.radius.card,
            padding: 14,
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <Info size={16} color={t.colors.primary} />
          <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
            As an Editor, you can upload new records or delete this record on behalf of {patient.name}.
          </Text>
        </View>
      </Screen>

      <ConfirmDrawer
        visible={deleteOpen}
        title="Delete Record?"
        message={`This will permanently remove this record from ${patient.name}'s shared health data. This action cannot be undone.`}
        confirmLabel="Delete Record"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => { setDeleteOpen(false); nav.goBack(); }}
      />
    </View>
  );
}
