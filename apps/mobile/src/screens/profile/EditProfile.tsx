import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
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

  const onChangePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    try {
      const ext = asset.uri.split(".").pop() ?? "jpg";
      const { url } = await uploadFile({
        uri: asset.uri,
        mimeType: asset.mimeType ?? `image/${ext}`,
        name: `avatar.${ext}`,
      });
      setAvatarUrl(url);
    } catch {
      Alert.alert("Error", "Could not upload photo. Please try again.");
    }
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
            <View
              style={{
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 12,
                marginVertical: 8,
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: t.colors.primary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 18 }}>{initials}</Text>
              </View>
              <Pressable onPress={onChangePhoto}>
                <Text style={{ color: t.colors.primary, fontWeight: "600" }}>Change Photo</Text>
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
