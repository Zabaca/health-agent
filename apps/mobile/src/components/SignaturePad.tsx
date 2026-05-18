import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Platform, Pressable, PanResponder, Text, TextInput, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Pencil } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";

export const AMBER_BG = "#FEF3C7";
export const AMBER_BORDER = "#D97706";
export const AMBER_TEXT = "#B45309";

const PAD_HEIGHT = 120;
const CURSIVE_FAMILY = Platform.OS === "ios" ? "SnellRoundhand" : "serif";

type Point = { x: number; y: number };
type SigMode = "draw" | "type";

export type SignaturePadRef = {
  getSignature: () => { image: string; printedName: string } | null;
};

function pointsToPath(pts: Point[]): string {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 0.5} ${pts[0].y}`;
  const [first, ...rest] = pts;
  return `M ${first.x} ${first.y} ` + rest.map(p => `L ${p.x} ${p.y}`).join(" ");
}

function buildDrawSvgDataUri(strokes: Point[][], width: number, height: number): string {
  const paths = strokes.map(stroke => {
    const d = pointsToPath(stroke);
    return `<path d="${d}" stroke="${AMBER_TEXT}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="white"/>${paths}</svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

function buildTextSvgDataUri(name: string): string {
  const w = 400; const h = 100;
  const escaped = name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="white"/><text x="${w / 2}" y="72" text-anchor="middle" font-family="cursive" font-size="56" fill="${AMBER_TEXT}">${escaped}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

type SignaturePadProps = {
  defaultName?: string;
};

export const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(function SignaturePad({ defaultName = "" }, ref) {
  const t = useTheme();
  const [mode, setMode] = useState<SigMode>("type");
  const [typedName, setTypedName] = useState(defaultName);
  const [completedStrokes, setCompletedStrokes] = useState<Point[][]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [padWidth, setPadWidth] = useState(0);
  const activeRef = useRef<Point[]>([]);
  const userEditedRef = useRef(false);

  useEffect(() => {
    if (defaultName && !userEditedRef.current) setTypedName(defaultName);
  }, [defaultName]);

  useImperativeHandle(ref, () => ({
    getSignature() {
      if (mode === "draw") {
        if (completedStrokes.length === 0) return null;
        return {
          image: buildDrawSvgDataUri(completedStrokes, padWidth || 360, PAD_HEIGHT),
          printedName: "",
        };
      } else {
        if (!typedName.trim()) return null;
        return {
          image: buildTextSvgDataUri(typedName.trim()),
          printedName: typedName.trim(),
        };
      }
    },
  }), [mode, completedStrokes, padWidth, typedName]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        activeRef.current = [{ x: locationX, y: locationY }];
        setCurrentPoints([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        activeRef.current = [...activeRef.current, { x: locationX, y: locationY }];
        setCurrentPoints([...activeRef.current]);
      },
      onPanResponderRelease: () => {
        const stroke = [...activeRef.current];
        activeRef.current = [];
        setCurrentPoints([]);
        if (stroke.length > 0) {
          setCompletedStrokes(prev => [...prev, stroke]);
        }
      },
    })
  ).current;

  const hasDrawing = completedStrokes.length > 0 || currentPoints.length > 0;
  const hasSignature = mode === "draw" ? hasDrawing : typedName.trim().length > 0;

  function clear() {
    setCompletedStrokes([]);
    setCurrentPoints([]);
    activeRef.current = [];
    userEditedRef.current = false;
    setTypedName(defaultName);
  }

  return (
    <View style={{ gap: 8 }}>
      {/* Draw / Type toggle */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.button,
          borderWidth: 1,
          borderColor: t.colors.border,
          overflow: "hidden",
        }}
      >
        {(["draw", "type"] as SigMode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={{
              flex: 1,
              paddingVertical: 9,
              alignItems: "center",
              backgroundColor: mode === m ? AMBER_BG : "transparent",
            }}
          >
            <Text
              style={{
                color: mode === m ? AMBER_TEXT : t.colors.textSecondary,
                fontWeight: mode === m ? "600" : "400",
                fontSize: 13,
              }}
            >
              {m === "draw" ? "Draw" : "Type"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Signature area */}
      <View
        style={{
          backgroundColor: AMBER_BG,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderStyle: "dashed",
          borderColor: AMBER_BORDER,
          overflow: "hidden",
        }}
      >
        {mode === "draw" ? (
          <View
            {...panResponder.panHandlers}
            onLayout={(e) => setPadWidth(e.nativeEvent.layout.width)}
            style={{ width: "100%", height: PAD_HEIGHT }}
          >
            {padWidth > 0 && (
              <Svg
                width={padWidth}
                height={PAD_HEIGHT}
                style={{ position: "absolute", top: 0, left: 0 }}
              >
                {completedStrokes.map((stroke, i) => (
                  <Path
                    key={i}
                    d={pointsToPath(stroke)}
                    stroke={AMBER_TEXT}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {currentPoints.length > 0 && (
                  <Path
                    d={pointsToPath(currentPoints)}
                    stroke={AMBER_TEXT}
                    strokeWidth={2.5}
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </Svg>
            )}
            {!hasDrawing && (
              <View
                style={{
                  position: "absolute",
                  top: 0, left: 0, right: 0, bottom: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Pencil size={18} color={AMBER_BORDER} />
                <Text style={{ color: AMBER_TEXT, fontSize: 13 }}>Draw or tap to sign</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ padding: 16, gap: 12 }}>
            <TextInput
              placeholder="Type your full name"
              placeholderTextColor={AMBER_BORDER}
              value={typedName}
              onChangeText={(v) => { userEditedRef.current = true; setTypedName(v); }}
              style={{
                borderBottomWidth: 1,
                borderBottomColor: AMBER_BORDER,
                paddingVertical: 6,
                fontSize: 15,
                color: AMBER_TEXT,
              }}
            />
            {typedName.trim().length > 0 ? (
              <Text
                style={{
                  fontFamily: CURSIVE_FAMILY,
                  fontSize: 38,
                  color: AMBER_TEXT,
                  textAlign: "center",
                  paddingVertical: 8,
                }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.5}
              >
                {typedName}
              </Text>
            ) : (
              <View style={{ alignItems: "center", paddingVertical: 16, gap: 6 }}>
                <Pencil size={18} color={AMBER_BORDER} />
                <Text style={{ color: AMBER_TEXT, fontSize: 13 }}>Your signature preview</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {hasSignature && (
        <View style={{ alignItems: "flex-end" }}>
          <Pressable onPress={clear} hitSlop={8}>
            <Text style={{ color: AMBER_TEXT, fontWeight: "600", fontSize: 13 }}>Clear</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
});
