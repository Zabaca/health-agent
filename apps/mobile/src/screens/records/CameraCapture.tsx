import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ArrowLeft, Camera as CameraIcon, RefreshCw } from "lucide-react-native";
import type { RecordsParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<RecordsParamList>;

export default function CameraCapture() {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const openSettings = () => {
    Linking.openSettings().catch(() => {});
  };

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000000", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000000", padding: 24, justifyContent: "center", gap: 16 }}>
        <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "700", textAlign: "center" }}>
          Camera access needed
        </Text>
        <Text style={{ color: "#FFFFFFAA", fontSize: 14, textAlign: "center" }}>
          HealthAgent needs camera permission to capture photos of your health documents.
        </Text>
        <Pressable
          onPress={permission.canAskAgain ? requestPermission : openSettings}
          style={{ backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 14, alignItems: "center" }}
        >
          <Text style={{ color: "#000000", fontWeight: "700", fontSize: 16 }}>
            {permission.canAskAgain ? "Grant Camera Access" : "Open Settings"}
          </Text>
        </Pressable>
        <Pressable onPress={() => nav.goBack()} style={{ paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ color: "#FFFFFFAA", fontSize: 16 }}>Cancel</Text>
        </Pressable>
      </View>
    );
  }

  const capture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (!photo?.uri) {
        Alert.alert("Capture failed", "Couldn't capture the photo. Please try again.");
        setCapturing(false);
        return;
      }
      const name = `capture-${Date.now()}.jpg`;
      nav.replace("UploadPreview", {
        uri: photo.uri,
        mimeType: "image/jpeg",
        name,
        width: photo.width,
        height: photo.height,
      });
    } catch (e) {
      Alert.alert("Capture failed", e instanceof Error ? e.message : "Unknown error");
      setCapturing(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} />
      <View
        style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          minHeight: 56,
        }}
      >
        <Pressable onPress={() => nav.goBack()} style={{ width: 40, height: 40, justifyContent: "center" }}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
        >
          <RefreshCw size={20} color="#FFFFFF" />
        </Pressable>
      </View>
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom + 32,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={capture}
          disabled={capturing}
          style={{
            width: 76,
            height: 76,
            borderRadius: 38,
            backgroundColor: "#FFFFFF",
            borderWidth: 4,
            borderColor: "#FFFFFF55",
            alignItems: "center",
            justifyContent: "center",
            opacity: capturing ? 0.5 : 1,
          }}
        >
          <CameraIcon size={28} color="#000000" />
        </Pressable>
      </View>
    </View>
  );
}
