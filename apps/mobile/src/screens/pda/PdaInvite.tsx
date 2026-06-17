import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldCheck, UserRound, Info } from "lucide-react-native";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { useRepresentedPatients } from "@/contexts/RepresentedPatientsContext";
import {
  respondToRepresentingInvite,
  getInviteByToken,
  listPendingRepresentingInvites,
  ApiError,
  type PendingRepresentingInvite,
} from "@/lib/api";
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
  const { refresh } = useRepresentedPatients();

  // In-app entry passes the full `invite`; an /invite/:token Universal Link
  // passes only the `token`, which we resolve to a pending invite below.
  const directInvite = params.invite;
  const token = params.token;

  const [invite, setInvite] = useState<PendingRepresentingInvite | null>(directInvite ?? null);
  const [loading, setLoading] = useState(!directInvite);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    if (directInvite || !token) return;
    let active = true;
    (async () => {
      try {
        // The token validates against the invitee's email; we match it to the
        // signed-in user's pending invites to keep the permission detail and
        // reuse the existing accept/decline endpoint (keyed by invite id). The
        // two calls are independent, so fetch them in parallel.
        const [meta, pending] = await Promise.all([
          getInviteByToken(token),
          listPendingRepresentingInvites(),
        ]);
        const full = pending.find((i) => i.id === meta.inviteId);
        if (!active) return;
        if (full) {
          setInvite(full);
        } else {
          setLoadError(
            `${meta.patientName}'s invitation was sent to ${meta.inviteeEmail}. Sign in with that email to accept it.`,
          );
        }
      } catch (e) {
        if (!active) return;
        setLoadError(
          e instanceof ApiError
            ? e.message
            : "Couldn't load this invitation. Please try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [directInvite, token]);

  const respond = async (action: "accept" | "decline") => {
    if (!invite) return;
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

  // Drag-to-close notch shared across all states.
  const Notch = (
    <Pressable
      onPress={() => nav.goBack()}
      hitSlop={{ top: 10, bottom: 10, left: 60, right: 60 }}
      style={{ alignItems: "center", paddingTop: insets.top + 8, paddingBottom: 4 }}
    >
      <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
    </Pressable>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {Notch}
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      </View>
    );
  }

  if (loadError || !invite) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        {Notch}
        <Screen
          bottom={
            <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
              <Button label="Close" variant="secondary" onPress={() => nav.goBack()} fullWidth />
            </View>
          }
          contentContainerStyle={{ gap: 16 }}
        >
          <View style={{ alignItems: "center", gap: 12, marginTop: 24 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: t.colors.destructiveBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Info size={28} color={t.colors.destructive} />
            </View>
            <Text style={t.type.h2}>Invitation Unavailable</Text>
            <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 16 }]}>
              {loadError ?? "This invitation could not be found."}
            </Text>
          </View>
        </Screen>
      </View>
    );
  }

  const patientName =
    `${invite.patientFirstName ?? ""} ${invite.patientLastName ?? ""}`.trim() ||
    invite.patientEmail;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      {Notch}

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
