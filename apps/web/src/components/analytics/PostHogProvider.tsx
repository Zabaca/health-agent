"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";

/**
 * PostHog client-side init + Provider for the App Router. Wraps the tree so any
 * client component can call `usePostHog()` to capture events.
 *
 * Design choices:
 * - `api_host: '/relay-Ke8z'` routes events through this app's reverse proxy
 *   (see next.config.mjs rewrites) so the SDK is first-party and survives ad
 *   blockers. The path is deliberately opaque — the literal `/ingest/` is
 *   widely fingerprinted by EasyPrivacy / uBlock PostHog lists. `ui_host`
 *   keeps "View in PostHog" links pointing at the real UI.
 * - `person_profiles: 'identified_only'` — anonymous-first. PostHog will NOT
 *   create a person profile for visitors until `posthog.identify()` is called.
 *   Since we don't identify anywhere yet, every event lands as anonymous, with
 *   no PII surface and lower cost.
 * - `capture_pageview: false` — App Router doesn't trigger a hard navigation,
 *   so PostHog's built-in pageview capture only fires on first paint. The
 *   sibling <PostHogPageView/> component fires `$pageview` on route changes.
 * - Init is keyed off `NEXT_PUBLIC_POSTHOG_KEY`; blank key = disabled (the
 *   Provider still renders so `usePostHog()` stays a no-op rather than throwing).
 */
export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return;
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "/relay-Ke8z",
      ui_host: "https://us.posthog.com",
      person_profiles: "identified_only",
      capture_pageview: false,
      capture_pageleave: true,
    });
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
