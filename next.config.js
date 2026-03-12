import withPWA from "@ducanh2912/next-pwa";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    config.resolve.alias.canvas = false;
    if (dev) config.cache = false;
    return config;
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
