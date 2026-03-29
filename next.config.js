import withPWA from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["mongoose", "bcryptjs"],
  },
  webpack: (config, { dev }) => {
    config.resolve.alias.canvas = false;
    if (dev) config.cache = false;
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

const pwaConfig = withPWA({
  dest: "public",
  // Disable in dev so HMR/CSS chunks aren't precached (avoids 404 on stale app/app/page.css etc.)
  disable: process.env.NODE_ENV === "development",
  register: process.env.NODE_ENV === "production",
  skipWaiting: true,
});

export default pwaConfig(nextConfig);
