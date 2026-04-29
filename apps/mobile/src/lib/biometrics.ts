import * as LocalAuthentication from "expo-local-authentication";

export type BiometricLabel = "Face ID" | "Touch ID" | "Biometric";

/**
 * True if the device has biometric hardware AND the user has enrolled at
 * least one biometric. False on simulators without enrolled face/finger,
 * older Androids without sensor, etc.
 */
export async function isBiometricSupported(): Promise<boolean> {
  const [hasHardware, isEnrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return hasHardware && isEnrolled;
}

/**
 * Used in screen copy + AccountSettings toggle label so Touch ID devices
 * read "Touch ID" instead of "Face ID".
 */
export async function getBiometricLabel(): Promise<BiometricLabel> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return "Face ID";
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return "Touch ID";
  return "Biometric";
}

/**
 * Prompts for biometric (or passcode fallback). `deviceOwnerAuthentication`
 * accepts Face ID, Touch ID, OR device passcode — so users without biometric
 * enrolled can still authenticate via PIN.
 */
export async function authenticate(
  reason: string,
): Promise<{ ok: true } | { ok: false; cancelled: boolean }> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: "Cancel",
    fallbackLabel: "Use Passcode",
    disableDeviceFallback: false,
  });
  if (result.success) return { ok: true };
  return {
    ok: false,
    cancelled:
      result.error === "user_cancel" ||
      result.error === "system_cancel" ||
      result.error === "app_cancel",
  };
}
