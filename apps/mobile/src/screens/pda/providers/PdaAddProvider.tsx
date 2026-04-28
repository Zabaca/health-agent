import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import type { PdaProvidersParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<PdaProvidersParamList>;

const types = ["Hospital", "Facility", "Insurance"];

export default function PdaAddProvider() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [type, setType] = useState(0);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header
        title="Add Provider"
        onBack={() => nav.goBack()}
        rightAction={{ label: "Save", onPress: () => nav.goBack() }}
      />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Button label="Add Provider" onPress={() => nav.goBack()} fullWidth />
          </View>
        }
        contentContainerStyle={{ gap: 12 }}
      >
        <Input label="Provider Name" placeholder="e.g. Valley Medical Center" />

        <View style={{ gap: 6 }}>
          <Text style={t.type.rowLabel}>Provider Type</Text>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: t.colors.surfaceSubtle,
              borderRadius: t.radius.button,
              padding: 4,
            }}
          >
            {types.map((label, i) => {
              const on = i === type;
              return (
                <Pressable
                  key={label}
                  onPress={() => setType(i)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                    backgroundColor: on ? t.colors.primary : "transparent",
                  }}
                >
                  <Text style={{ color: on ? "#FFFFFF" : t.colors.textPrimary, fontWeight: "600", fontSize: 13 }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Input label="Physician Name" placeholder="Optional" />
        <Input label="Phone" placeholder="Optional" keyboardType="phone-pad" />
        <Input label="Fax" placeholder="Optional" keyboardType="phone-pad" />
        <Input label="Email" placeholder="Optional" autoCapitalize="none" keyboardType="email-address" />
        <Input label="Address" placeholder="Optional" multiline />
      </Screen>
    </View>
  );
}
