import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronDown, ChevronRight, FileText, Stethoscope, Send, UserRound, Mail } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { PulsingView } from "@/components/PulsingView";
import { AuthenticatedImage } from "@/components/AuthenticatedImage";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import { representedPatientName } from "@/lib/api";
import type { PdaHomeParamList, PdaProfileParamList, PdaTabsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaHomeParamList & PdaTabsParamList & PdaProfileParamList>;

const cap = (s: string | null) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "None");

function initials(first: string | null, last: string | null) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

export default function PdaHome() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { user } = useAuth();
  const { patients, pendingInvites, currentPatient, loading } = useRepresentedPatients();
  // Only a meaningful switch when there's another target: an own patient
  // account, or more than one represented patient.
  const canSwitchRole = !!user?.isPatient || patients.length > 1;

  if (loading || !currentPatient) {
    return (
      <Screen safeTop contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={t.colors.primary} />
      </Screen>
    );
  }

  const patientName = representedPatientName(currentPatient);
  const patientInitials = initials(currentPatient.firstName, currentPatient.lastName);
  // Selector pill: "First L." when a name is set, otherwise the email (never the raw user ID).
  const hasName = !!(currentPatient.firstName || currentPatient.lastName);
  const pillLabel = hasName
    ? `${currentPatient.firstName ?? ""}${currentPatient.lastName ? ` ${currentPatient.lastName[0]}.` : ""}`.trim()
    : currentPatient.email ?? "Patient";

  const firstInvite = pendingInvites[0];
  const inviteName = firstInvite
    ? `${firstInvite.patientFirstName ?? ""} ${firstInvite.patientLastName ?? ""}`.trim() || firstInvite.patientEmail
    : "";

  const accessRows = [
    {
      id: "records",
      label: "Health Records",
      Icon: FileText,
      value: currentPatient.healthRecordsPermission,
      target: "PdaRecordsTab" as const,
    },
    {
      id: "providers",
      label: "Manage Providers",
      Icon: Stethoscope,
      value: currentPatient.manageProvidersPermission,
      target: "PdaProvidersTab" as const,
    },
    {
      id: "releases",
      label: "HIPAA Releases",
      Icon: Send,
      value: currentPatient.releasePermission,
      target: "PdaReleasesTab" as const,
    },
  ];

  return (
    <Screen testID="pda-home-screen" safeTop contentContainerStyle={{ gap: 16 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={[t.type.h1, { flex: 1 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          Overview
        </Text>
        <Pressable
          disabled={!canSwitchRole}
          onPress={() => nav.navigate("RoleSwitcher")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: t.radius.pill,
            backgroundColor: t.colors.primaryBg,
          }}
        >
          <Text style={{ color: t.colors.primary, fontWeight: "600", maxWidth: 160 }} numberOfLines={1}>
            {pillLabel}
          </Text>
          {canSwitchRole ? <ChevronDown size={16} color={t.colors.primary} /> : null}
        </Pressable>
      </View>

      {firstInvite ? (
        <Pressable
          onPress={() => nav.navigate("PdaInvite", { invite: firstInvite })}
          style={{
            backgroundColor: "#FFF7ED",
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: "#FED7AA",
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          <PulsingView>
            <Mail size={22} color="#F97316" />
          </PulsingView>
          <View style={{ flex: 1 }}>
            <Text style={[t.type.bodyStrong, { color: "#9A3412" }]}>
              {pendingInvites.length > 1 ? `${pendingInvites.length} pending invitations` : "Pending invitation"}
            </Text>
            <Text style={[t.type.caption, { color: "#C2410C" }]} numberOfLines={1}>
              {inviteName} invited you to represent them
            </Text>
          </View>
          <ChevronRight size={18} color="#F97316" />
        </Pressable>
      ) : null}

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
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: t.colors.primaryBg,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {currentPatient.avatarUrl ? (
            <AuthenticatedImage uri={currentPatient.avatarUrl} style={{ width: 44, height: 44 }} resizeMode="cover" />
          ) : patientInitials ? (
            <Text style={{ color: t.colors.primary, fontWeight: "700" }}>{patientInitials}</Text>
          ) : (
            <UserRound size={22} color={t.colors.primary} />
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={t.type.bodyStrong}>{patientName}</Text>
          {currentPatient.relationship ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: t.colors.primary }} />
              <Text style={[t.type.caption, { color: t.colors.primary, fontWeight: "500" }]}>
                {currentPatient.relationship}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View>
        <Text style={[t.type.sectionLabel, { textTransform: "uppercase", marginBottom: 8 }]}>YOUR ACCESS</Text>
        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.border,
            overflow: "hidden",
          }}
        >
          {accessRows.map((row, i) => (
            <Pressable
              key={row.id}
              onPress={() => nav.getParent()?.navigate(row.target as never)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              <row.Icon size={18} color={t.colors.primary} />
              <Text style={[t.type.body, { flex: 1 }]}>{row.label}</Text>
              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  borderRadius: t.radius.pill,
                  backgroundColor: row.value === "editor" ? t.colors.primaryBg : t.colors.surfaceSubtle,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: row.value === "editor" ? t.colors.primary : t.colors.textSecondary,
                  }}
                >
                  {cap(row.value)}
                </Text>
              </View>
              <ChevronRight size={16} color={t.colors.textSecondary} />
            </Pressable>
          ))}
        </View>
      </View>
    </Screen>
  );
}
