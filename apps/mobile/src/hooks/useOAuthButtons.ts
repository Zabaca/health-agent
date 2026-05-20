import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { useAuth } from "@/hooks/useAuth";

// Required by expo-auth-session so the auth popup can hand the result back.
WebBrowser.maybeCompleteAuthSession();

/**
 * Shared wiring for the Apple + Google sign-in buttons used on both the
 * SignIn and CreateAccount screens.
 *
 * - Apple: runs the native sheet via useAuth().signInApple (iOS only).
 * - Google: opens the system browser via expo-auth-session's id-token flow;
 *   on success, hands the id_token to useAuth().signInGoogle.
 *
 * Client IDs come from EXPO_PUBLIC_GOOGLE_{IOS,ANDROID}_CLIENT_ID. Without
 * them the Google request never becomes ready (googleReady stays false).
 */
export function useOAuthButtons() {
  const { signInApple, signInGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === "success") {
      const idToken = response.params?.id_token;
      if (!idToken) {
        setError("Google did not return a token. Please try again.");
        return;
      }
      setBusy(true);
      signInGoogle(idToken)
        .then((r) => {
          if (!r.ok && r.error) setError(r.error);
        })
        .finally(() => setBusy(false));
    } else if (response.type === "error") {
      setError("Google sign-in failed. Please try again.");
    }
    // "dismiss" / "cancel" → benign, no error surfaced.
  }, [response, signInGoogle]);

  const onApple = async () => {
    setError(null);
    setBusy(true);
    const r = await signInApple();
    setBusy(false);
    if (!r.ok && r.error) setError(r.error);
  };

  const onGoogle = async () => {
    setError(null);
    await promptAsync();
  };

  return {
    onApple,
    onGoogle,
    error,
    busy,
    /** Apple sign-in is iOS-only; hide the button elsewhere. */
    appleAvailable: Platform.OS === "ios",
    /** Google request is configured + ready to prompt. */
    googleReady: !!request,
  };
}
