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
type Options = {
  /** "signin" exchanges the provider token for a session; "link" attaches it to the current account. */
  mode?: "signin" | "link";
  /** Called after a successful link (mode="link") so the screen can refresh status. */
  onLinked?: () => void;
};

export function useOAuthButtons({ mode = "signin", onLinked }: Options = {}) {
  const { signInApple, signInGoogle, linkApple, linkGoogle } = useAuth();
  const appleAction = mode === "link" ? linkApple : signInApple;
  const googleAction = mode === "link" ? linkGoogle : signInGoogle;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // One Google OAuth client for both platforms. The env var keeps its
  // `_IOS_` name (matches secrets.yaml) but the client is used for iOS AND
  // Android. This works as long as the client is configured to accept both
  // (e.g. a Web-type client); a strictly iOS-type client would be rejected by
  // Google for Android requests — that's a Google Cloud config concern, not code.
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: googleClientId,
    androidClientId: googleClientId,
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
      googleAction(idToken)
        .then((r) => {
          if (!r.ok && r.error) setError(r.error);
          else if (r.ok && mode === "link") onLinked?.();
        })
        .finally(() => setBusy(false));
    } else if (response.type === "error") {
      setError("Google sign-in failed. Please try again.");
    }
    // "dismiss" / "cancel" → benign, no error surfaced.
  }, [response, googleAction, mode, onLinked]);

  const onApple = async () => {
    setError(null);
    setBusy(true);
    const r = await appleAction();
    setBusy(false);
    if (!r.ok && r.error) setError(r.error);
    else if (r.ok && mode === "link") onLinked?.();
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
