import type { LinkingOptions } from "@react-navigation/native";

/**
 * Deep-link configuration for the `zabaca://` URL scheme.
 *
 * JAM-281 ships only the scheme + path → screen mapping. The push-notification
 * → URL bridge is owned by JAM-277, which will call `Linking.openURL('zabaca://records')`
 * (or similar) from a notification-response handler.
 *
 * RootNavigator mounts AuthStack, TabsNavigator, or PdaTabsNavigator directly
 * (no wrapping route), so paths target tab screen names. Patient and PDA tab
 * names don't collide; only one tree is mounted at a time so unmatched paths
 * are no-ops.
 */
export const linking: LinkingOptions<object> = {
  prefixes: ["zabaca://"],
  config: {
    screens: {
      // Patient role
      HomeTab: "home",
      RecordsTab: { screens: { RecordsList: "records" } },
      ReleasesTab: { screens: { ReleasesList: "releases" } },
      ProvidersTab: { screens: { MyProviders: "providers" } },
      ProfileTab: { screens: { Profile: "profile" } },
      // PDA role
      PdaHomeTab: "pda/home",
      PdaRecordsTab: { screens: { PdaRecords: "pda/records" } },
      PdaReleasesTab: { screens: { PdaReleases: "pda/releases" } },
      PdaProvidersTab: { screens: { PdaProviders: "pda/providers" } },
      PdaProfileTab: { screens: { PdaProfile: "pda/profile" } },
    },
  },
};
