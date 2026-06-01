declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    /** Google OAuth client ID — one client used for both iOS and Android (expo-auth-session). */
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
    /** PostHog public project API key (phc_…). Empty disables analytics. */
    EXPO_PUBLIC_POSTHOG_KEY?: string;
  };
};
