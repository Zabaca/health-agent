declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    /** Google OAuth client ID — one client used for both iOS and Android (expo-auth-session). */
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
    /** PostHog public project API key (phc_…). Empty disables analytics. */
    EXPO_PUBLIC_POSTHOG_KEY?: string;
    /** "1" only under the Maestro E2E harness (set by its Metro). Toggles
     *  test-only affordances like suppressing iOS AutoFill on secure fields. */
    EXPO_PUBLIC_E2E?: string;
  };
};
