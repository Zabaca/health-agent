import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Pencil } from "lucide-react-native";
import ImageView from "react-native-image-viewing";
import { WebView } from "react-native-webview";
import { API_URL, getSessionToken } from "@/lib/api";
import { PdaEditRecordForm } from "@/screens/pda/records/PdaEditRecordSheet";
import type { PdaRecordsParamList } from "@/navigation/types";

type R = RouteProp<PdaRecordsParamList, "PdaRecordDetail">;

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "tiff", "tif", "heic", "heif"]);

function isImage(fileType: string): boolean {
  return IMAGE_EXTS.has(fileType.toLowerCase().replace(/^\./, ""));
}

function absoluteUrl(fileURL: string): string {
  if (/^https?:\/\//i.test(fileURL)) return fileURL;
  return `${API_URL}${fileURL.startsWith("/") ? "" : "/"}${fileURL}`;
}

export default function PdaRecordDetail() {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<R>();
  const [token, setToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);
  const [imageVisible, setImageVisible] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [localName, setLocalName] = useState(params.originalName ?? params.fileType.toUpperCase());
  const [localReleaseCode, setLocalReleaseCode] = useState(params.releaseCode);

  useEffect(() => {
    let cancelled = false;
    getSessionToken().then((t) => {
      if (cancelled) return;
      setToken(t);
      setTokenReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Natural swipe-to-close on image viewer → go back (only when not in edit mode)
  useEffect(() => {
    if (!imageVisible && !editMode) nav.goBack();
  }, [imageVisible, editMode, nav]);

  const closeImage = useCallback(() => setImageVisible(false), []);

  const url = absoluteUrl(params.fileURL);
  const image = isImage(params.fileType);
  const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
  const canEdit = params.permission === "editor";

  // ─── Image viewer ──────────────────────────────────────────────────────────
  if (image) {
    // Render the edit form inline — ImageView is unmounted so its native modal
    // is gone before the form appears, avoiding any iOS modal conflict.
    if (editMode) {
      return (
        <PdaEditRecordForm
          fileId={params.fileId}
          name={localName}
          releaseCode={localReleaseCode}
          source={params.source}
          patientId={params.patientId}
          onClose={() => nav.goBack()}
          onSaved={(name, code) => {
            setLocalName(name);
            setLocalReleaseCode(code);
            nav.goBack();
          }}
        />
      );
    }

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
            FooterComponent={canEdit ? () => (
              <View style={{ alignItems: "flex-end", paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}>
                <Pressable
                  onPress={() => setEditMode(true)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: "#FFFFFF22",
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                    borderRadius: 20,
                  }}
                >
                  <Pencil size={14} color="#FFFFFF" />
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>Edit details</Text>
                </Pressable>
              </View>
            ) : undefined}
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
  if (editMode) {
    return (
      <PdaEditRecordForm
        fileId={params.fileId}
        name={localName}
        releaseCode={localReleaseCode}
        source={params.source}
        patientId={params.patientId}
        onClose={() => setEditMode(false)}
        onSaved={(name, code) => {
          setLocalName(name);
          setLocalReleaseCode(code);
          setEditMode(false);
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#1F1F1F" }}>
      <View style={{ paddingTop: insets.top, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", minHeight: 56 }}>
        <Pressable onPress={() => nav.goBack()} style={{ width: 40, height: 40, justifyContent: "center" }}>
          <ArrowLeft size={22} color="#FFFFFF" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }} numberOfLines={1}>
            {localName}
          </Text>
        </View>
        {canEdit ? (
          <Pressable
            onPress={() => setEditMode(true)}
            style={{ width: 40, height: 40, justifyContent: "center", alignItems: "center" }}
          >
            <Pencil size={18} color="#FFFFFF" />
          </Pressable>
        ) : null}
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
