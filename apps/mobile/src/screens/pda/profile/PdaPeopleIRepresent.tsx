import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { UserPlus, ChevronRight } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import type { PdaProfileParamList } from "@/navigation/types";
import type { RepresentedPatient } from "@/lib/api";

type Nav = NativeStackNavigationProp<PdaProfileParamList>;

function patientName(p: RepresentedPatient) {
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.patientId;
}

function patientInitials(p: RepresentedPatient) {
  return `${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`.toUpperCase();
}

export default function PdaPeopleIRepresent() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { switchTo } = useRole();
  const { patients, loading } = useRepresentedPatients();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header
        title="People I Represent"
        onBack={() => nav.goBack()}
        rightAction={{ icon: <UserPlus size={22} color={t.colors.primary} />, onPress: () => nav.navigate("PdaInvite") }}
      />
      <Screen contentContainerStyle={{ gap: 12 }}>
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : patients.length === 0 ? (
          <Text style={t.type.caption}>No active patient relationships.</Text>
        ) : (
          <>
            <Text style={t.type.caption}>Choose whose records to access</Text>
            {patients.map((p) => (
              <Pressable
                key={p.patientId}
                onPress={() => {
                  switchTo("pda", p.patientId);
                  nav.popToTop();
                }}
              >
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
                      borderRadius: 20,
                      backgroundColor: t.colors.primaryBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: t.colors.primary, fontWeight: "700" }}>{patientInitials(p)}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={t.type.bodyStrong}>{patientName(p)}</Text>
                    {p.relationship ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.primary }} />
                        <Text style={[t.type.caption, { color: t.colors.primary, fontWeight: "500" }]}>
                          {p.relationship}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <ChevronRight size={16} color={t.colors.textSecondary} />
                </View>
              </Pressable>
            ))}
          </>
        )}
      </Screen>
    </View>
  );
}
