import { NextResponse } from "next/server";

// Apple Universal Links association file for the Veladon iOS app.
// Served (no redirect, application/json) at
// https://app.veladon.com/.well-known/apple-app-site-association so that the
// in-scope email links open the app when installed. The `paths` array is an
// allowlist — only these patterns hand off to the app; everything else
// (e.g. /staff-invite/*) stays on the web.
//
// App ID = <TeamID>.<bundleId> = CYCW5D248P.com.zabaca.veladon
export const dynamic = "force-static";

const ASSOCIATION = {
  applinks: {
    apps: [],
    details: [
      {
        appID: "CYCW5D248P.com.zabaca.veladon",
        paths: ["/reset-password", "/my-records", "/releases", "/invite/*"],
      },
    ],
  },
};

export function GET() {
  return NextResponse.json(ASSOCIATION, {
    headers: { "content-type": "application/json" },
  });
}
