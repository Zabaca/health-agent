import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldCheck, UserRound, Info } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import { respondToRepresentingInvite } from "@/lib/api";
import type { PdaProfileParamList } from "@/navigation/types";

type R = RouteProp<PdaProfileParamList, "PdaInvite">;
type Nav = NativeStackNavigationProp<PdaProfileParamList>;

function cap(s: string | null | undefined): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function permissionLabel(p: "viewer" | "editor" | null): string {
  if (p === "editor") return "Edit access";
  if (p === "viewer") return "View access";
  return "No access";
}

export default function PdaInvite() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<R>();
  const { invite } = params;
  const { refresh } = useRepresentedPatients();

  const [acting, setActing] = useState(false);

  const patientName =
    `${invite.patientFirstName ?? ""} ${invite.patientLastName ?? ""}`.trim() ||
    invite.patientEmail;

  const respond = async (action: "accept" | "decline") => {
    setActing(true);
    try {
      await respondToRepresentingInvite(invite.id, action);
      if (action === "accept") await refresh();
      nav.goBack();
    } catch {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setActing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {/* Notch — drag to close */}
      <Pressable
        onPress={() => nav.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 60, right: 60 }}
        style={{ alignItems: "center", paddingTop: insets.top + 8, paddingBottom: 4 }}
      >
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
      </Pressable>

      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16, gap: 10 }}>
            <Button
              label={acting ? "Please wait…" : "Accept Invitation"}
              onPress={() => respond("accept")}
              fullWidth
              disabled={acting}
            />
            <Button
              label="Decline Invitation"
              variant="secondary"
              onPress={() => respond("decline")}
              fullWidth
              disabled={acting}
            />
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        {/* Hero */}
        <View style={{ alignItems: "center", gap: 12, marginTop: 8 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: t.colors.primaryBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={28} color={t.colors.primary} />
          </View>
          <Text style={t.type.h2}>You've Been Invited</Text>
          <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 16 }]}>
            <Text style={{ fontWeight: "600" }}>{patientName}</Text>
            {" has invited you to be their Patient Designated Agent."}
          </Text>
        </View>

        {/* Invite details */}
        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.border,
            overflow: "hidden",
          }}
        >
          <Row
            icon={<UserRound size={18} color={t.colors.textSecondary} />}
            title={patientName}
            subtitle={invite.relationship ? cap(invite.relationship) : invite.patientEmail}
          />
          <Row
            icon={<ShieldCheck size={18} color={t.colors.textSecondary} />}
            title="Health Records"
            subtitle={permissionLabel(invite.healthRecordsPermission)}
            isFirst={false}
          />
          <Row
            icon={<ShieldCheck size={18} color={t.colors.textSecondary} />}
            title="Manage Providers"
            subtitle={permissionLabel(invite.manageProvidersPermission)}
            isFirst={false}
          />
          <Row
            icon={<ShieldCheck size={18} color={t.colors.textSecondary} />}
            title="HIPAA Releases"
            subtitle={permissionLabel(invite.releasePermission)}
            isFirst={false}
          />
        </View>

        {/* Info note */}
        <View
          style={{
            backgroundColor: t.colors.primaryBg,
            borderRadius: t.radius.card,
            padding: 14,
            flexDirection: "row",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <Info size={16} color={t.colors.primary} />
          <Text style={[t.type.caption, { color: t.colors.primary, flex: 1 }]}>
            As their designated agent, you'll be able to act on {invite.patientFirstName ? `${invite.patientFirstName}'s` : "their"} behalf within the permissions listed above.
          </Text>
        </View>
      </Screen>
    </View>
  );
}

function Row({
  icon,
  title,
  subtitle,
  isFirst = true,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  isFirst?: boolean;
}) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderTopWidth: isFirst ? 0 : 1,
        borderTopColor: t.colors.divider,
      }}
    >
      {icon}
      <View style={{ flex: 1 }}>
        <Text style={t.type.bodyStrong}>{title}</Text>
        <Text style={t.type.caption}>{subtitle}</Text>
      </View>
    </View>
  );
}
