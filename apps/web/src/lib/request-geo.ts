/**
 * Resolves the caller's location from Vercel's `x-vercel-ip-*` edge headers
 * (free on all Vercel plans). Returns nulls outside Vercel and for IPs Vercel
 * can't resolve (loopback, private ranges).
 *
 * https://vercel.com/docs/edge-network/headers#x-vercel-ip-country
 */
export type RequestGeo = {
  country: string | null;
  region: string | null;
  city: string | null;
  latitude: string | null;
  longitude: string | null;
};

type HeaderGetter = (name: string) => string | null;

/** URL-encoded city/region values come back from Vercel; decode for display. */
function decode(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function extractRequestGeo(get: HeaderGetter): RequestGeo {
  return {
    country: decode(get("x-vercel-ip-country")),
    region: decode(get("x-vercel-ip-country-region")),
    city: decode(get("x-vercel-ip-city")),
    latitude: get("x-vercel-ip-latitude"),
    longitude: get("x-vercel-ip-longitude"),
  };
}
