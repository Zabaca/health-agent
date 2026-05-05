import { useCallback, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation, type CompositeNavigationProp } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { ArrowRight, Circle, CheckCircle2, ChevronRight } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { useTheme } from "@/theme/ThemeProvider";
import { getSetupStatus, type SetupStatus } from "@/lib/api";
import type { HomeParamList, TabsParamList } from "@/navigation/types";

type Nav = CompositeNavigationProp<
  NativeStackNavigationProp<HomeParamList>,
  BottomTabNavigationProp<TabsParamList>
>;

export default function AccountSetup() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [status, setStatus] = useState<SetupStatus | null>(null);

  useFocusEffect(useCallback(() => {
    getSetupStatus().then(setStatus).catch(() => {});
  }, []));

  const prereqsMet = !!(status?.profileComplete && status?.providerAdded);

  const steps = [
    {
      id: "profile",
      title: "Complete your profile",
      body: "Your name, date of birth, and contact details are required to create accurate medical record releases.",
      complete: status?.profileComplete ?? false,
      disabled: false,
      onPress: () => nav.navigate("ProfileTab", { screen: "EditProfile" } as never),
    },
    {
      id: "provider",
      title: "Add a provider",
      body: "Add the healthcare providers — clinics, hospitals, or insurance companies — you want to request records from.",
      complete: status?.providerAdded ?? false,
      disabled: false,
      onPress: () => nav.navigate("ProvidersTab", { screen: "AddProvider" } as never),
    },
    {
      id: "invite",
      title: "Invite someone to help",
      body: "Authorize a trusted person such as a family member or caregiver to manage your health records on your behalf.",
      complete: status?.pdaAdded ?? false,
      disabled: !prereqsMet,
      onPress: () => nav.navigate("ProfileTab", { screen: "InviteRepresentative" } as never),
    },
    {
      id: "release",
      title: "Create your first release",
      body: "Submit a HIPAA-compliant authorization to request your medical records from your providers.",
      complete: status?.releaseCreated ?? false,
      disabled: !prereqsMet,
      onPress: () => nav.navigate("ReleasesTab", { screen: "WizardStep1" } as never),
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Account Setup" onBack={() => nav.goBack()} />
      <Screen contentContainerStyle={{ gap: 16 }}>
        <Text style={t.type.caption}>Complete these steps to get the most from Health Agent.</Text>

        {steps.map((s) => (
          <Pressable
            key={s.id}
            onPress={s.onPress}
            disabled={s.disabled}
            style={{ opacity: s.disabled ? 0.45 : 1 }}
          >
            <View
              style={{
                backgroundColor: t.colors.surface,
                borderRadius: t.radius.card,
                borderWidth: 1,
                borderColor: s.complete ? t.colors.primary : t.colors.border,
                padding: 16,
                gap: 8,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                {s.complete ? (
                  <CheckCircle2 size={20} color={t.colors.primary} />
                ) : (
                  <Circle size={20} color={t.colors.borderMuted} />
                )}
                <Text style={[t.type.bodyStrong, { flex: 1 }]}>{s.title}</Text>
                <ChevronRight size={20} color={t.colors.textSecondary} />
              </View>
              <Text style={[t.type.body, { paddingLeft: 30 }]}>{s.body}</Text>
              {!s.complete && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingLeft: 30, marginTop: 4 }}>
                  <Text style={{ color: s.disabled ? t.colors.textSecondary : t.colors.primary, fontWeight: "600" }}>
                    {s.disabled ? "Complete previous steps first" : "Get started"}
                  </Text>
                  {!s.disabled && <ArrowRight size={14} color={t.colors.primary} />}
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </Screen>
    </View>
  );
}
