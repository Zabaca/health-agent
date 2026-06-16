import {
  getStateFromPath as defaultGetStateFromPath,
  type LinkingOptions,
} from "@react-navigation/native";

/**
 * Deep-link configuration for the `zabaca://` scheme and `https://app.veladon.com`
 * Universal Links (iOS).
 *
 * Universal Links: notification emails point at https://app.veladon.com/<path>.
 * Apple's apple-app-site-association (served by apps/web) is the gatekeeper — only
 * /reset-password, /my-records, /releases, and /invite/* are handed to the app; all
 * other URLs stay on the web. Each of those maps to a screen below.
 *
 * RootNavigator mounts AuthStack, TabsNavigator, or PdaTabsNavigator directly
 * (no wrapping route), so paths target screen names in whichever tree is mounted.
 * Patient and PDA tab names don't collide; only one tree is mounted at a time, so
 * unmatched paths are no-ops (e.g. /my-records while logged out → SignIn).
 *
 * JAM-281 shipped the original scheme + path → screen mapping; the
 * push-notification → URL bridge is owned by JAM-277.
 */
export const linking: LinkingOptions<object> = {
  prefixes: ["zabaca://", "https://app.veladon.com"],
  // Legacy `zabaca://records` predates the web `/my-records` path. Alias it so
  // both resolve to RecordsList, then defer to the default parser.
  getStateFromPath(path, options) {
    const normalized = path.replace(/^\/?records(?=$|[/?#])/, "my-records");
    return defaultGetStateFromPath(normalized, options);
  },
  config: {
    screens: {
      // Logged-out (AuthStack). `?token=` is parsed into route.params.token.
      ResetPassword: "reset-password",
      // Patient role
      HomeTab: "home",
      RecordsTab: { screens: { RecordsList: "my-records" } },
      ReleasesTab: { screens: { ReleasesList: "releases" } },
      ProvidersTab: { screens: { MyProviders: "providers" } },
      ProfileTab: { screens: { Profile: "profile" } },
      // PDA role. `/invite/:token` → PdaInvite with route.params.token.
      PdaHomeTab: "pda/home",
      PdaRecordsTab: { screens: { PdaRecords: "pda/records" } },
      PdaReleasesTab: { screens: { PdaReleases: "pda/releases" } },
      PdaProvidersTab: { screens: { PdaProviders: "pda/providers" } },
      PdaProfileTab: {
        screens: { PdaProfile: "pda/profile", PdaInvite: "invite/:token" },
      },
    },
  },
};
