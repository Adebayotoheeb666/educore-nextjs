import type { NextConfig } from "next";
import webpack from "webpack";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // Cache strategies for different resource types
    runtimeCaching: [
      {
        // API routes: network first, fall back to cache
        urlPattern: /^https?:\/\/.*\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 }, // 1hr
          networkTimeoutSeconds: 10,
        },
      },
      {
        // Static assets: cache first
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: { maxEntries: 128, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 days
        },
      },
      {
        // Pages: stale-while-revalidate
        urlPattern: /^https?:\/\/[^/]+(?!\/?api\/).*/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "pages-cache",
          expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 }, // 1 day
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  output: "export",
  turbopack: {
    root: ".",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

  async headers() {
    const allowedOrigins = process.env.ALLOWED_ORIGINS ?? "*";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: allowedOrigins },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization,X-Requested-With" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
      {
        source: "/api/v1/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: allowedOrigins },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,PUT,PATCH,DELETE,OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type,Authorization,X-Requested-With" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "/api/uploads/:path*",
      },
    ];
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "ui-avatars.com" },
    ],
  },

  webpack(config) {
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@capacitor-community\/secure-storage$|^capacitor-secure-storage-plugin$/,
        contextRegExp: /.*/,
      })
    );
    config.externals = config.externals || [];
    config.externals.push({
      "pdfkit": "commonjs pdfkit",
      "bull": "commonjs bull",
    });
    return config;
  },
};

export default withPWA(nextConfig);
