import {
  Alert, Platform, PanResponder, Pressable, Text, TextInput, View,
} from "react-native";
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Svg, { Path } from "react-native-svg";
import { Pencil } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeProvider";
import type { ReleasesParamList } from "@/navigation/types";
import type { UserProvider, ReleaseProviderInput, CreateReleaseInput } from "@/lib/api";
import { getProfile, createRelease } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { WizardShell } from "./_WizardShell";
import { useWizard } from "./_WizardContext";

type Nav = NativeStackNavigationProp<ReleasesParamList>;

const AMBER_BG = "#FEF3C7";
const AMBER_BORDER = "#D97706";
const AMBER_TEXT = "#B45309";

const PAD_HEIGHT = 120;
const CURSIVE_FAMILY = Platform.OS === "ios" ? "SnellRoundhand" : "serif";

type Point = { x: number; y: number };

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

function displayName(p: UserProvider): string {
  return p.providerType === "Insurance" ? (p.insurance ?? p.providerName) : p.providerName;
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

type SigMode = "draw" | "type";

type SignaturePadRef = {
  getSignature: () => { image: string; printedName: string } | null;
};

type SignaturePadProps = {
  defaultName?: string;
};

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(function SignaturePad({ defaultName = "" }, ref) {
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

export default function WizardStep5() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const { wizard, setWizard } = useWizard();
  const { user } = useAuth();
  const signaturePadRef = useRef<SignaturePadRef>(null);
  const [creating, setCreating] = useState(false);
  const [patientName, setPatientName] = useState("");

  useFocusEffect(useCallback(() => {
    setWizard(prev => ({ ...prev, isEditing: false }));
  }, [setWizard]));

  useEffect(() => {
    getProfile().then((p) => {
      setPatientName(`${p.firstName ?? ""} ${p.lastName ?? ""}`.trim());
    }).catch(() => {});
  }, []);

  const providerDisplayName = wizard.provider ? displayName(wizard.provider) : "—";
  const validUntil = wizard.expiryDate
    ? `${formatDate(wizard.expiryDate)} · ${wizard.durationLabel}`
    : "—";
  const representativeName = !wizard.representativeLabel || wizard.representativeLabel === "Self-requested"
    ? "yourself"
    : wizard.representativeLabel;

  function editStep(navigate: () => void) {
    setWizard(prev => ({ ...prev, isEditing: true }));
    navigate();
  }

  const rows: { label: string; value: string; onEdit: () => void }[] = [
    {
      label: "Request records from",
      value: providerDisplayName,
      onEdit: () => editStep(() => nav.navigate("WizardStep1")),
    },
    {
      label: "Representative",
      value: wizard.representativeLabel || "Self-requested",
      onEdit: () => editStep(() => nav.navigate("WizardStep3")),
    },
    {
      label: "Records included",
      value: wizard.recordsSummary || "—",
      onEdit: () =>
        editStep(() =>
          nav.navigate("WizardStep2", {
            providerType: wizard.provider?.providerType ?? "",
            providerId: wizard.provider?.id ?? "",
          })
        ),
    },
    {
      label: "Valid until",
      value: validUntil,
      onEdit: () => editStep(() => nav.navigate("WizardStep4")),
    },
  ];

  async function handleCreate() {
    const sig = signaturePadRef.current?.getSignature();
    if (!sig) {
      Alert.alert("Signature Required", "Please sign before creating the release.");
      return;
    }
    if (!wizard.provider) {
      Alert.alert("Missing Info", "Please go back and select a provider.");
      return;
    }
    if (!wizard.fields) {
      Alert.alert("Missing Info", "Please go back and select records to release.");
      return;
    }
    if (!wizard.expiryDate) {
      Alert.alert("Missing Info", "Please go back and set an expiry date.");
      return;
    }

    try {
      setCreating(true);
      const profile = await getProfile();

      const missingFields: string[] = [];
      if (!profile.dateOfBirth) missingFields.push("date of birth");
      if (!profile.address) missingFields.push("mailing address");
      if (!profile.phoneNumber) missingFields.push("phone number");
      if (missingFields.length > 0) {
        Alert.alert(
          "Incomplete Profile",
          `Please complete your profile before creating a release. Missing: ${missingFields.join(", ")}.`
        );
        return;
      }

      const today = toLocalIsoDate(new Date());
      const expiryDateStr = toLocalIsoDate(wizard.expiryDate);

      const providerInput: ReleaseProviderInput = {
        providerName: wizard.provider.providerName || undefined,
        providerType: wizard.provider.providerType as "Insurance" | "Hospital" | "Facility",
        insurance: wizard.provider.insurance ?? undefined,
        patientId: wizard.provider.patientId ?? undefined,
        patientMemberId: wizard.provider.patientMemberId ?? undefined,
        groupId: wizard.provider.groupId ?? undefined,
        planName: wizard.provider.planName ?? undefined,
        phone: wizard.provider.phone ?? undefined,
        fax: wizard.provider.fax ?? undefined,
        providerEmail: wizard.provider.providerEmail ?? undefined,
        address: wizard.provider.address ?? undefined,
        membershipIdFront: wizard.provider.membershipIdFront ?? undefined,
        membershipIdBack: wizard.provider.membershipIdBack ?? undefined,
        ...wizard.fields,
        allAvailableDates: true,
        purpose: "At the request of the individual",
      };

      const isSelf = wizard.representativeId === "self";
      const input: CreateReleaseInput = {
        firstName: profile.firstName,
        middleName: profile.middleName || undefined,
        lastName: profile.lastName,
        dateOfBirth: profile.dateOfBirth,
        mailingAddress: profile.address,
        phoneNumber: profile.phoneNumber,
        email: user?.email ?? "",
        ssn: (profile.ssn && profile.ssn.replace(/\D/g, "").length === 4) ? profile.ssn.replace(/\D/g, "") : null,
        providers: [providerInput],
        releaseAuthAgent: !isSelf,
        releaseAuthZabaca: false,
        authAgentName: isSelf ? undefined : wizard.representativeLabel,
        authExpirationDate: expiryDateStr,
        authPrintedName: sig.printedName || `${profile.firstName} ${profile.lastName}`.trim(),
        authSignatureImage: sig.image,
        authDate: today,
      };

      await createRelease(input);
      nav.popToTop();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create release. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <WizardShell
      step={5}
      subtitle="Review & Sign"
      primaryLabel={creating ? "Creating…" : "Create Release"}
      onPrimary={handleCreate}
      primaryDisabled={creating}
    >
      <View
        style={{
          backgroundColor: t.colors.surface,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          padding: 14,
          gap: 4,
        }}
      >
        <Text style={[t.type.bodyStrong, { marginBottom: 4 }]}>Release Summary</Text>
        {rows.map((row, i) => (
          <View
            key={row.label}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 8,
              borderTopWidth: i === 0 ? 0 : 1,
              borderTopColor: t.colors.divider,
              gap: 8,
            }}
          >
            <Text style={[t.type.caption, { width: 110, flexShrink: 0 }]}>{row.label}</Text>
            <Text
              style={[t.type.body, { fontWeight: "600", flex: 1, textAlign: "right" }]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {row.value}
            </Text>
            <Pressable onPress={row.onEdit} hitSlop={8} style={{ flexShrink: 0 }}>
              <Text style={{ color: t.colors.primary, fontWeight: "600", fontSize: 13 }}>Edit</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Text style={t.type.caption}>
        By signing, you authorize {representativeName} to request your health records from{" "}
        {providerDisplayName} for the period stated. You may revoke this release at any time.
      </Text>

      <SignaturePad ref={signaturePadRef} defaultName={patientName} />
    </WizardShell>
  );
}
