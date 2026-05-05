import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import { User } from "lucide-react-native";
import { Header } from "@/components/Header";
import { Screen } from "@/components/Screen";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { useTheme } from "@/theme/ThemeProvider";
import { getProfile, updateProfile, uploadFile, ApiError } from "@/lib/api";
import type { ProfileParamList } from "@/navigation/types";

type Nav = NativeStackNavigationProp<ProfileParamList>;

export default function EditProfile() {
  const t = useTheme();
  const nav = useNavigation<Nav>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
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
        setDateOfBirth(p.dateOfBirth);
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
    if (!dateOfBirth.trim()) {
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
        dateOfBirth: dateOfBirth.trim(),
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
                    <Image
                      source={{ uri: (avatarPreview ?? avatarUrl)! }}
                      style={{ width: 72, height: 72 }}
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
            <Input label="Date of Birth" value={dateOfBirth} onChangeText={setDateOfBirth} />
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
