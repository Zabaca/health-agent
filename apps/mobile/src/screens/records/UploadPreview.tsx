import { useState } from "react";
import { ActivityIndicator, Image, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertTriangle, ArrowLeft, Check } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import { registerRecord, uploadFile } from "@/lib/api";
import type { RecordsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RecordsParamList>;
type R = RouteProp<RecordsParamList, "UploadPreview">;

function extFromMime(mime: string): string {
  const slash = mime.indexOf("/");
  if (slash === -1) return "bin";
  const sub = mime.slice(slash + 1).toLowerCase();
  if (sub === "jpeg") return "jpg";
  return sub;
}

export default function UploadPreview() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<R>();
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onConfirm = async () => {
    setUploading(true);
    setError(null);
    setProgress(0);
    try {
      const { url } = await uploadFile({
        uri: params.uri,
        mimeType: params.mimeType,
        name: params.name,
        onProgress: setProgress,
      });
      // /api/records/upload stores fileType as the bare extension (matches web).
      await registerRecord({
        fileURL: url,
        fileType: extFromMime(params.mimeType),
        originalName: params.name,
      });
      // Drop the upload modal stack and surface RecordsList — its useFocusEffect
      // refetches and the new record appears.
      nav.popToTop();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setUploading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <View
        style={{
          paddingTop: insets.top,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          minHeight: 56,
        }}
      >
        <Pressable
          onPress={() => nav.goBack()}
          disabled={uploading}
          style={{ width: 40, height: 40, justifyContent: "center", opacity: uploading ? 0.4 : 1 }}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600", flex: 1 }} numberOfLines={1}>
          Preview
        </Text>
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <Image
          source={{ uri: params.uri }}
          style={{ width: "100%", height: "100%", maxHeight: "100%" }}
          resizeMode="contain"
        />
      </View>

      {error ? (
        <View
          style={{
            marginHorizontal: 16,
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            backgroundColor: "#3A1A1A",
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
          }}
        >
          <AlertTriangle size={18} color="#FFB4B4" />
          <Text style={{ color: "#FFB4B4", flex: 1, fontSize: 13 }}>{error}</Text>
        </View>
      ) : null}

      {uploading ? (
        <View style={{ paddingHorizontal: 16, gap: 8, marginBottom: 12 }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: "#FFFFFF22", overflow: "hidden" }}>
            <View
              style={{
                height: "100%",
                width: `${Math.max(4, progress)}%`,
                backgroundColor: t.colors.primary,
              }}
            />
          </View>
          <Text style={{ color: "#FFFFFFAA", fontSize: 12, textAlign: "center" }}>
            Uploading… {progress}%
          </Text>
        </View>
      ) : null}

      <View
        style={{
          paddingHorizontal: 16,
          paddingBottom: insets.bottom + 16,
          paddingTop: 8,
          flexDirection: "row",
          gap: 12,
        }}
      >
        <Pressable
          onPress={() => nav.goBack()}
          disabled={uploading}
          style={{
            flex: 1,
            height: 52,
            borderRadius: t.radius.button,
            backgroundColor: "#FFFFFF22",
            alignItems: "center",
            justifyContent: "center",
            opacity: uploading ? 0.4 : 1,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Retake</Text>
        </Pressable>
        <Pressable
          onPress={onConfirm}
          disabled={uploading}
          style={{
            flex: 1,
            height: 52,
            borderRadius: t.radius.button,
            backgroundColor: t.colors.primary,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Check size={18} color="#FFFFFF" />
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>Upload</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
