import { Text, View } from "react-native";
import * as Application from "expo-application";
import { useTheme } from "@/theme/ThemeProvider";

/** Standard iOS-style version footer: "Version 1.0.0 (1)". Build number is
 *  omitted when it matches the marketing version (Expo's default), since
 *  showing "1.0.0 (1.0.0)" reads as noise. */
export function VersionFooter() {
  const t = useTheme();
  const version = Application.nativeApplicationVersion ?? "—";
  const build = Application.nativeBuildVersion ?? null;
  const showBuild = build && build !== version;
  return (
    <View style={{ alignItems: "center", paddingVertical: 16 }}>
      <Text style={[t.type.caption, { color: t.colors.textSecondary }]}>
        Version {version}{showBuild ? ` (${build})` : ""}
      </Text>
    </View>
  );
}
