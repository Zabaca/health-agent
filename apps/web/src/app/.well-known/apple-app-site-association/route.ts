import { NextResponse } from "next/server";

// Apple Universal Links association file for the Veladon iOS app.
// Served (no redirect, application/json) at
// https://app.veladon.com/.well-known/apple-app-site-association so that the
// in-scope email links open the app when installed. The `paths` array is an
// allowlist — only these patterns hand off to the app; everything else
// (e.g. /staff-invite/*) stays on the web.
//
// NOTE: /invite/* is intentionally NOT allowlisted. The mobile app has no
// logged-out invite-accept flow (PdaInvite only mounts inside PdaTabsNavigator —
// signed-in + PDA role + onboarded) and there is no deferred deep-linking, so
// handing the app an /invite/:token link while logged out would dead-end on
// SignIn. Leaving it off the allowlist lets invite emails open the web accept
// page (apps/web/src/app/(auth)/invite/[token]), which handles login/register +
// accept for any auth state. The in-app PdaInvite-by-token path stays reachable
// via the zabaca:// scheme used by push notifications.
//
// App ID = <TeamID>.<bundleId> = CYCW5D248P.com.zabaca.veladon
export const dynamic = "force-static";

const ASSOCIATION = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "CYCW5D248P.com.zabaca.veladon",
        paths: ["/reset-password", "/my-records", "/releases"],
      },
    ],
  },
};

export function GET() {
  return NextResponse.json(ASSOCIATION, {
    headers: { "content-type": "application/json" },
  });
}
