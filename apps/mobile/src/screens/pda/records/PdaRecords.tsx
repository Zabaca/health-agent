import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Upload, ChevronRight, FlaskConical, Scan, FileText, FolderHeart, ShieldOff, Eye } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { findPatient } from "@/mock/pda";
import { mockRecords, type RecordKind } from "@/mock/records";
import type { PdaRecordsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaRecordsParamList>;

const iconFor: Record<RecordKind, (color: string) => React.ReactNode> = {
  labs: (c) => <FlaskConical size={20} color={c} />,
  imaging: (c) => <Scan size={20} color={c} />,
  notes: (c) => <FileText size={20} color={c} />,
};

const labelFor: Record<RecordKind, string> = {
  labs: "Labs",
  imaging: "Imaging",
  notes: "Notes",
};

export default function PdaRecords() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { representing } = useRole();
  const patient = findPatient(representing);
  const perm = patient.permissions.records;
  const firstName = patient.name.split(" ")[0];
  const items = mockRecords;
  const empty = items.length === 0;

  const headerRow = (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Text style={[t.type.h1, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        Health Records
      </Text>
      {perm === "editor" ? (
        <Pressable hitSlop={8}>
          <Upload size={22} color={t.colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );

  if (perm === "none") {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <EmptyState
          icon={<ShieldOff size={32} color={t.colors.textSecondary} />}
          title="No access to records"
          subtitle={`${patient.name} hasn't granted you access to their health records. Ask them to update your permissions from their account settings.`}
        />
      </Screen>
    );
  }

  if (empty) {
    return (
      <Screen safeTop contentContainerStyle={{ gap: 16, flexGrow: 1 }}>
        {headerRow}
        <EmptyState
          icon={<FolderHeart size={32} color={t.colors.primary} />}
          iconBg={t.colors.primaryBg}
          title="No records yet"
          subtitle={`Upload ${firstName}'s medical records or wait for providers to send them in via HIPAA release.`}
          actions={
            perm === "editor"
              ? [
                  {
                    label: "Upload Record",
                    icon: <Upload size={16} color="#FFFFFF" />,
                    onPress: () => {},
                  },
                ]
              : []
          }
        />
      </Screen>
    );
  }

  return (
    <Screen safeTop contentContainerStyle={{ gap: 16 }}>
      {headerRow}

      {perm === "viewer" ? (
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
          <Eye size={16} color={t.colors.primary} />
          <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
            Viewer access — you can view {firstName}'s records but cannot upload or delete.
          </Text>
        </View>
      ) : null}

      {items.map((r) => (
        <Pressable key={r.id} onPress={() => nav.navigate("PdaRecordDetail", { recordId: r.id })}>
          <View
            style={{
              backgroundColor: t.colors.surface,
              borderRadius: t.radius.card,
              borderWidth: 1,
              borderColor: t.colors.border,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: t.colors.primaryBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {iconFor[r.kind](t.colors.primary)}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={t.type.bodyStrong}>{r.title}</Text>
              <Text style={t.type.caption}>{labelFor[r.kind]} · {r.date}</Text>
            </View>
            <ChevronRight size={16} color={t.colors.textSecondary} />
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}
