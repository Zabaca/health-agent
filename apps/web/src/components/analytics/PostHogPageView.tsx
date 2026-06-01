"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";

/**
 * Fires `$pageview` on every App Router navigation. Next.js client navigation
 * doesn't reload the page, so PostHog's auto pageview fires only on first
 * paint — this effect closes the gap by watching pathname + search params.
 *
 * `useSearchParams()` opts the component into Suspense; we wrap with <Suspense>
 * so it doesn't force the entire tree into client-side rendering at build time
 * (Next would otherwise refuse to statically render any page above it).
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const posthog = usePostHog();

  useEffect(() => {
    if (!pathname || !posthog) return;
    const qs = searchParams?.toString();
    const url = qs ? `${window.location.origin}${pathname}?${qs}` : `${window.location.origin}${pathname}`;
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, posthog]);

  return null;
}

export default function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PageViewTracker />
    </Suspense>
  );
}
