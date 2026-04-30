import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import ImageView from "react-native-image-viewing";
import { WebView } from "react-native-webview";
import { API_URL, getSessionToken } from "@/lib/api";
import type { RecordsParamList } from "@/navigation/types";

type R = RouteProp<RecordsParamList, "DocumentViewer">;

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "tiff", "tif", "heic", "heif"]);

function isImage(fileType: string): boolean {
  return IMAGE_EXTS.has(fileType.toLowerCase().replace(/^\./, ""));
}

function absoluteUrl(fileURL: string): string {
  if (/^https?:\/\//i.test(fileURL)) return fileURL;
  return `${API_URL}${fileURL.startsWith("/") ? "" : "/"}${fileURL}`;
}

export default function DocumentViewer() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<R>();
  const [token, setToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  // ImageView wraps a native <Modal>. Driving `visible` via state lets the
  // modal play its dismiss animation cleanly; calling nav.goBack() while
  // `visible` was hard-coded to `true` left the native Modal half-mounted
  // on iOS and ate touches on the underlying screen.
  const [imageVisible, setImageVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSessionToken().then((t) => {
      if (cancelled) return;
      setToken(t);
      setTokenReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pop the screen once the Modal has been told to dismiss.
  useEffect(() => {
    if (!imageVisible) nav.goBack();
  }, [imageVisible, nav]);

  const closeImage = useCallback(() => setImageVisible(false), []);

  const url = absoluteUrl(params.fileURL);
  const image = isImage(params.fileType);
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

  // ─── Image viewer ──────────────────────────────────────────────────────────
  // ImageView renders its own X button + swipe-to-close, and its native Modal
  // covers any custom header we'd render here, so we don't add one.
  if (image) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000000" }}>
        {tokenReady ? (
          <ImageView
            images={[{ uri: url, headers }]}
            imageIndex={0}
            visible={imageVisible}
            onRequestClose={closeImage}
            swipeToCloseEnabled
            doubleTapToZoomEnabled
            backgroundColor="#000000"
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        )}
      </View>
    );
  }

  // ─── Document viewer (PDF / other via WebView) ────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: "#1F1F1F" }}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", minHeight: 56 }}>
        <Pressable onPress={() => nav.goBack()} style={{ width: 40, height: 40, justifyContent: "center" }}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }} numberOfLines={1}>
            {params.title}
          </Text>
        </View>
      </View>
      {tokenReady ? (
        <WebView
          source={{ uri: url, headers }}
          originWhitelist={["*"]}
          startInLoadingState
          renderLoading={() => (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#1F1F1F" }}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
          style={{ flex: 1, backgroundColor: "#1F1F1F" }}
        />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      )}
    </View>
  );
}
