import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { User, Calendar } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { getProfile, updateProfile, uploadFile, ApiError } from "@/lib/api";
import { AuthenticatedImage } from "@/components/AuthenticatedImage";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

const DEFAULT_DOB = new Date(2000, 0, 1);

function dateToIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseDob(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function formatDob(date: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function EditProfile() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState<Date | null>(null);
  const [draftDob, setDraftDob] = useState<Date>(DEFAULT_DOB);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [ssn, setSsn] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((p) => {
        setFirstName(p.firstName);
        setMiddleName(p.middleName ?? "");
        setLastName(p.lastName);
        setDob(parseDob(p.dateOfBirth));
        setPhoneNumber(p.phoneNumber);
        setAddress(p.address);
        setSsn(p.ssn ?? "");
        setAvatarUrl(p.avatarUrl);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handlePickedAsset = async (asset: ImagePicker.ImagePickerAsset) => {
    setAvatarPreview(asset.uri);
    setUploading(true);
    try {
      const ext = asset.uri.split(".").pop() ?? "jpg";
      const { url } = await uploadFile({
        uri: asset.uri,
        mimeType: asset.mimeType ?? `image/${ext}`,
        name: `avatar.${ext}`,
      });
      setAvatarUrl(url);
    } catch {
      setAvatarPreview(null);
      Alert.alert("Error", "Could not upload photo. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const openLibrary = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow photo library access in Settings.", [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) await handlePickedAsset(result.assets[0]);
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission required", "Please allow camera access in Settings.", [
        { text: "Cancel", style: "cancel" },
        { text: "Open Settings", onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) await handlePickedAsset(result.assets[0]);
  };

  const onChangePhoto = () => {
    Alert.alert("Change Photo", undefined, [
      { text: "Take Photo", onPress: openCamera },
      { text: "Choose from Library", onPress: openLibrary },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const onSave = async () => {
    setError(null);
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    if (!dob) {
      setError("Date of birth is required.");
      return;
    }
    if (!phoneNumber.trim() || !address.trim()) {
      setError("Phone number and address are required.");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        middleName: middleName.trim() || undefined,
        lastName: lastName.trim(),
        dateOfBirth: dateToIso(dob),
        address: address.trim(),
        phoneNumber: phoneNumber.trim(),
        ssn: ssn.trim() || undefined,
        avatarUrl: avatarUrl ?? undefined,
      });
      nav.goBack();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <Header title="Edit Profile" onBack={() => nav.goBack()} />
      <Screen
        bottom={
          <View style={{ paddingHorizontal: t.spacing.gutter, paddingBottom: 16 }}>
            <Button label="Save Changes" onPress={onSave} fullWidth disabled={saving || loading} />
          </View>
        }
        contentContainerStyle={{ gap: 12 }}
      >
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <ActivityIndicator color={t.colors.primary} />
          </View>
        ) : (
          <>
            <View style={{ alignItems: "center", marginVertical: 8, gap: 8 }}>
              <Pressable onPress={onChangePhoto}>
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 36,
                    backgroundColor: t.colors.primaryBg,
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {avatarPreview ?? avatarUrl ? (
                    <AuthenticatedImage
                      uri={avatarPreview ?? avatarUrl}
                      style={{ width: 72, height: 72 }}
                      resizeMode="cover"
                    />
                  ) : initials ? (
                    <Text style={{ color: t.colors.primary, fontWeight: "700", fontSize: 22 }}>
                      {initials}
                    </Text>
                  ) : (
                    <User size={32} color={t.colors.primary} />
                  )}
                  {uploading && (
                    <View
                      style={{
                        ...StyleSheet.absoluteFillObject,
                        backgroundColor: "rgba(0,0,0,0.4)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                </View>
              </Pressable>
              <Pressable onPress={onChangePhoto}>
                <Text style={{ color: t.colors.primary, fontWeight: "600", fontSize: 14 }}>
                  Change Photo
                </Text>
              </Pressable>
            </View>

            {error ? (
              <Text style={{ color: t.colors.destructive, textAlign: "center" }}>{error}</Text>
            ) : null}

            <Input label="First Name" value={firstName} onChangeText={setFirstName} />
            <Input label="Middle Name" placeholder="Optional" value={middleName} onChangeText={setMiddleName} />
            <Input label="Last Name" value={lastName} onChangeText={setLastName} />
            <View style={{ gap: 6 }}>
              <Text style={t.type.rowLabel}>DATE OF BIRTH</Text>
              <Pressable
                onPress={() => {
                  setDraftDob(dob ?? DEFAULT_DOB);
                  setShowDobPicker(true);
                }}
                style={{
                  height: 48,
                  paddingHorizontal: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: t.colors.surface,
                  borderWidth: 1,
                  borderColor: t.colors.border,
                  borderRadius: t.radius.button,
                }}
              >
                <Text style={{ flex: 1, fontSize: 16, color: dob ? t.colors.textPrimary : t.colors.textPlaceholder }}>
                  {dob ? formatDob(dob) : "Select date"}
                </Text>
                <Calendar size={18} color={t.colors.textSecondary} />
              </Pressable>
            </View>

            {/* Android: native dialog shown directly */}
            {showDobPicker && Platform.OS === "android" ? (
              <DateTimePicker
                value={draftDob}
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(e: DateTimePickerEvent, date?: Date) => {
                  setShowDobPicker(false);
                  if (e.type === "set" && date) setDob(date);
                }}
              />
            ) : null}

            {/* iOS: spinner inside a Cancel/Done bottom sheet */}
            {Platform.OS === "ios" ? (
              <Modal visible={showDobPicker} transparent animationType="fade" onRequestClose={() => setShowDobPicker(false)}>
                <Pressable
                  style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
                  onPress={() => setShowDobPicker(false)}
                >
                  <Pressable onPress={() => { /* swallow inner taps */ }}>
                    <View style={{ backgroundColor: t.colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: t.spacing.gutter, paddingTop: 16, paddingBottom: 8 }}>
                        <Pressable onPress={() => setShowDobPicker(false)}>
                          <Text style={{ color: t.colors.textSecondary, fontSize: 15 }}>Cancel</Text>
                        </Pressable>
                        <Text style={t.type.bodyStrong}>Date of Birth</Text>
                        <Pressable onPress={() => { setDob(draftDob); setShowDobPicker(false); }}>
                          <Text style={{ color: t.colors.primary, fontSize: 15, fontWeight: "600" }}>Done</Text>
                        </Pressable>
                      </View>
                      <DateTimePicker
                        value={draftDob}
                        mode="date"
                        display="spinner"
                        maximumDate={new Date()}
                        onChange={(_: DateTimePickerEvent, date?: Date) => { if (date) setDraftDob(date); }}
                      />
                    </View>
                  </Pressable>
                </Pressable>
              </Modal>
            ) : null}
            <Input label="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
            <Input label="Address" value={address} onChangeText={setAddress} />
            <Input
              label="Last 4 of SSN · Optional"
              value={ssn}
              onChangeText={setSsn}
              secureTextEntry
              keyboardType="number-pad"
              maxLength={4}
            />
          </>
        )}
      </Screen>
    </View>
  );
}
