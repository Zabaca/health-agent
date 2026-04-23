/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["bcryptjs", "@libsql/client"],
  },
  transpilePackages: ["@health-agent/types"],
};

export default nextConfig;
