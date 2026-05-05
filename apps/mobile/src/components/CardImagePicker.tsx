import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, X } from "lucide-react-native";
import { AuthenticatedImage } from "@/components/AuthenticatedImage";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  label: string;
  value: string | null | undefined;
  onChange: (dataUri: string | null) => void;
  required?: boolean;
};

export function CardImagePicker({ label, value, onChange, required }: Props) {
  const t = useTheme();
  const [loading, setLoading] = useState(false);

  async function pick(source: "camera" | "library") {
    try {
      setLoading(true);
      let result: ImagePicker.ImagePickerResult;
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert("Permission needed", "Camera access is required to take a photo.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          base64: true,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.8,
          base64: true,
        });
      }
      if (!result.canceled && result.assets[0]?.base64) {
        const asset = result.assets[0];
        const mime = asset.mimeType ?? "image/jpeg";
        onChange(`data:${mime};base64,${asset.base64}`);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image.");
    } finally {
      setLoading(false);
    }
  }

  function showPicker() {
    Alert.alert(label, "Choose a source", [
      { text: "Take Photo", onPress: () => pick("camera") },
      { text: "Choose from Library", onPress: () => pick("library") },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  const hasImage = !!value;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={t.type.rowLabel}>{label.toUpperCase()}</Text>
        {required && <Text style={{ color: t.colors.destructive, fontSize: 12, fontWeight: "600" }}>*</Text>}
      </View>

      {hasImage ? (
        <View style={{ position: "relative" }}>
          <AuthenticatedImage
            uri={value}
            style={{
              width: "100%",
              aspectRatio: 85.6 / 54,
              borderRadius: t.radius.card,
              backgroundColor: t.colors.surfaceSubtle,
            }}
          />
          <Pressable
            onPress={() => onChange(null)}
            hitSlop={8}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(0,0,0,0.55)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={showPicker}
            style={{
              position: "absolute",
              bottom: 8,
              right: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: "rgba(0,0,0,0.55)",
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Camera size={12} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "600" }}>Replace</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={showPicker}
          disabled={loading}
          style={{
            height: 100,
            borderRadius: t.radius.card,
            borderWidth: 1.5,
            borderStyle: "dashed",
            borderColor: t.colors.border,
            backgroundColor: t.colors.surface,
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <ImagePlus size={22} color={t.colors.primary} />
          <Text style={{ color: t.colors.primary, fontWeight: "600", fontSize: 13 }}>
            {loading ? "Loading…" : "Tap to add"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
