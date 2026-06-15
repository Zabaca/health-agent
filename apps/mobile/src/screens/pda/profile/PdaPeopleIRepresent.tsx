import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Mail, ChevronRight, UserRound } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { AuthenticatedImage } from "@/components/AuthenticatedImage";
import { useTheme } from "@/theme/ThemeProvider";
import { useRole } from "@/hooks/useRole";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import { listPendingRepresentingInvites, representedPatientName, type PendingRepresentingInvite } from "@/lib/api";
import type { PdaProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaProfileParamList>;

const INVITE_ORANGE = "#F97316";

export default function PdaPeopleIRepresent() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { switchTo } = useRole();
  const { patients, loading, currentPatient } = useRepresentedPatients();
  const [pendingInvites, setPendingInvites] = useState<PendingRepresentingInvite[]>([]);

  useFocusEffect(useCallback(() => {
    listPendingRepresentingInvites().then(setPendingInvites).catch(() => {});
  }, []));

  const firstInvite = pendingInvites[0];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header
        title="People I Represent"
        onBack={() => nav.goBack()}
        rightAction={
          firstInvite
            ? {
                icon: <Mail size={22} color={INVITE_ORANGE} />,
                onPress: () => nav.navigate("PdaInvite", { invite: firstInvite }),
              }
            : undefined
        }
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
            {patients.map((p) => {
              const initials = `${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`.toUpperCase();
              const isActive = p.patientId === currentPatient?.patientId;
              return (
                <Pressable
                  key={p.patientId}
                  onPress={() => {
                    if (!isActive) {
                      switchTo("pda", p.patientId);
                      nav.popToTop();
                    } else {
                      nav.navigate("RoleSwitcher");
                    }
                  }}
                >
                  <View
                    style={{
                      backgroundColor: t.colors.surface,
                      borderRadius: t.radius.card,
                      borderWidth: 1,
                      borderColor: isActive ? t.colors.primary : t.colors.border,
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
                        overflow: "hidden",
                      }}
                    >
                      {p.avatarUrl ? (
                        <AuthenticatedImage uri={p.avatarUrl} style={{ width: 40, height: 40 }} resizeMode="cover" />
                      ) : initials ? (
                        <Text style={{ color: t.colors.primary, fontWeight: "700" }}>{initials}</Text>
                      ) : (
                        <UserRound size={20} color={t.colors.primary} />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={t.type.bodyStrong} numberOfLines={1}>{representedPatientName(p)}</Text>
                      {p.relationship ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.primary }} />
                          <Text style={[t.type.caption, { color: t.colors.primary, fontWeight: "500" }]}>
                            {p.relationship}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    {isActive ? (
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: t.radius.pill,
                          backgroundColor: t.colors.primaryBg,
                        }}
                      >
                        <Text style={{ color: t.colors.primary, fontSize: 12, fontWeight: "600" }}>Viewing</Text>
                      </View>
                    ) : (
                      <ChevronRight size={16} color={t.colors.textSecondary} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </>
        )}
      </Screen>
    </View>
  );
}
