import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ShieldCheck, User, Info } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { inviteFromPatient } from "@/mock/pda";
import type { PdaProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaProfileParamList>;

export default function PdaInvite() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header variant="close" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16, gap: 10 }}>
            <Button label="Accept & Create Account" onPress={() => nav.goBack()} fullWidth />
            <Button label="Decline Invitation" variant="secondary" onPress={() => nav.goBack()} fullWidth />
          </View>
        }
        contentContainerStyle={{ gap: 16 }}
      >
        <View style={{ alignItems: "center", gap: 12, marginTop: 8 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: t.colors.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShieldCheck size={28} color="#FFFFFF" />
          </View>
          <Text style={t.type.h2}>You've Been Invited</Text>
          <Text style={[t.type.caption, { textAlign: "center", paddingHorizontal: 16 }]}>
            {inviteFromPatient.name} has invited you to manage their health records as their Patient Designated Agent.
          </Text>
        </View>

        <View
          style={{
            backgroundColor: t.colors.surface,
            borderRadius: t.radius.card,
            borderWidth: 1,
            borderColor: t.colors.border,
            overflow: "hidden",
          }}
        >
          <Row icon={<User size={18} color={t.colors.textSecondary} />} title={inviteFromPatient.name} subtitle="Sent you an invitation" />
          <Row icon={<ShieldCheck size={18} color={t.colors.textSecondary} />} title="Patient Designated Agent" subtitle="Access to records, providers & releases" isFirst={false} />
        </View>

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
            As their agent, you can view health records, manage providers, and initiate HIPAA releases on {inviteFromPatient.name}'s behalf.
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
