import type { NextConfig } from "next";

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  /* config options here */

  // Enable Turbopack optimizations
  turbopack: {
    // Empty config to silence webpack warning
  },

  // Enable production optimizations
  productionBrowserSourceMaps: false,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Experimental features for bundle optimization
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      '@tanstack/react-table',
      'recharts',
      'framer-motion',
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
