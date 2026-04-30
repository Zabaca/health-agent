import { Alert, Linking, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera, Image as ImageIcon, ChevronRight } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "@/theme/ThemeProvider";
import type { RecordsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RecordsParamList>;

function inferMime(uri: string, fallback = "image/jpeg"): string {
  const ext = uri.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (ext === "png") return "image/png";
  if (ext === "gif") return "image/gif";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "pdf") return "application/pdf";
  return fallback;
}

function fileNameFromUri(uri: string, mime: string): string {
  const last = uri.split("?")[0].split("/").pop() ?? "upload";
  if (last.includes(".")) return last;
  const ext = mime.split("/")[1] ?? "jpg";
  return `${last}.${ext}`;
}

export default function UploadSheet() {
  const t = useTheme();
  const nav = useNavigation<Nav>();

  const openSettings = () => {
    Linking.openSettings().catch(() => {});
  };

  const goCamera = () => {
    nav.replace("CameraCapture", { source: "camera" });
  };

  const goLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        "Photo library access needed",
        "Enable Photos access in Settings to choose an existing image.",
        [{ text: "Cancel", style: "cancel" }, { text: "Open Settings", onPress: openSettings }],
      );
      return;
    }
    let result;
    try {
      result = await ImagePicker.launchImageLibraryAsync({
        // expo-image-picker 16 deprecated `MediaTypeOptions`; use the
        // string-array form documented at
        // https://docs.expo.dev/versions/v52.0.0/sdk/imagepicker/.
        mediaTypes: ["images"],
        quality: 0.9,
        allowsMultipleSelection: false,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("[UploadSheet] launchImageLibraryAsync threw:", e);
      Alert.alert("Photo library", e instanceof Error ? e.message : "Failed to open photo library");
      return;
    }
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? inferMime(asset.uri);
    nav.replace("UploadPreview", {
      uri: asset.uri,
      mimeType: mime,
      name: asset.fileName ?? fileNameFromUri(asset.uri, mime),
      width: asset.width,
      height: asset.height,
    });
  };

  const sources = [
    { id: "camera", label: "Take Photo", icon: Camera, tile: t.colors.primaryBg, fg: t.colors.primary, onPress: goCamera },
    { id: "library", label: "Photo Library", icon: ImageIcon, tile: t.colors.surfaceSubtle, fg: t.colors.textSecondary, onPress: goLibrary },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.surface }}>
      <View style={{ alignItems: "center", paddingTop: 8 }}>
        <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: t.colors.borderMuted }} />
      </View>
      <Text style={[t.type.h3, { textAlign: "center", marginTop: 16, marginBottom: 12 }]}>Upload Record</Text>
      <View>
        {sources.map((s, i) => {
          const Icon = s.icon;
          return (
            <Pressable
              key={s.id}
              onPress={s.onPress}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: t.spacing.gutter,
                paddingVertical: 14,
                gap: 14,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: t.colors.divider,
              }}
            >
              <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: s.tile, alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} color={s.fg} />
              </View>
              <Text style={[t.type.body, { flex: 1 }]}>{s.label}</Text>
              <ChevronRight size={18} color={t.colors.textSecondary} />
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <Pressable onPress={() => nav.goBack()} style={{ padding: 16, alignItems: "center" }}>
        <Text style={{ color: t.colors.accent, fontWeight: "600", fontSize: 16 }}>Cancel</Text>
      </Pressable>
    </View>
  );
}
