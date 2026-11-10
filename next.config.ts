import type { NextConfig } from "next";

import { parseR2PublicHostname } from "./src/server/storage/r2-env";

/**
 * Allow next/image optimization for the configured R2 public host only.
 * Hostname is read from R2_PUBLIC_BASE_URL at build/start — never hardcode.
 */
function r2RemotePatterns(): NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
> {
  const parsed = parseR2PublicHostname();
  if (!parsed) return [];
  return [
    {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      port: parsed.port,
      pathname: "/**",
    },
  ];
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    remotePatterns: [...r2RemotePatterns()],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
