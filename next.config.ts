import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    config.externals = config.externals ?? [];
    if (Array.isArray(config.externals)) {
      config.externals.push(({ request }: { request?: string }, callback: (err?: null, result?: string) => void) => {
        if (request?.startsWith("cloudflare:")) {
          return callback(null, `node-commonjs ${request}`);
        }
        callback();
      });
    }
    return config;
  },
};

export default nextConfig;
