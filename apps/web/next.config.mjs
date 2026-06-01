/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "@libsql/client"],
  },
  transpilePackages: ["@health-agent/types"],
  webpack: (config) => {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return config;
  },
  // PostHog reverse proxy — routes /relay-Ke8z/* through this app so the SDK
  // requests look first-party and survive ad/tracker blockers. Path is
  // deliberately opaque: the literal `/ingest/` (PostHog's documented default)
  // is widely fingerprinted by EasyPrivacy / uBlock PostHog lists and gets
  // ERR_BLOCKED_BY_CLIENT'd. A random-looking suffix bypasses the common rules.
  // Order matters: static + array (PostHog's asset CDN) must precede the
  // catch-all to the US ingest host. skipTrailingSlashRedirect is required
  // for PostHog endpoints.
  async rewrites() {
    return [
      { source: "/relay-Ke8z/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" },
      { source: "/relay-Ke8z/array/:path*", destination: "https://us-assets.i.posthog.com/array/:path*" },
      { source: "/relay-Ke8z/:path*", destination: "https://us.i.posthog.com/:path*" },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
