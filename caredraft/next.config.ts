import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization configuration
  images: {
    // Enable modern image formats (WebP, AVIF)
    formats: ['image/webp', 'image/avif'],
    
    // Configure responsive image sizes for different devices
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Configure external image domains if needed
    // domains: ['example.com', 'cdn.example.com'],
    
    // Cache optimization for images
    minimumCacheTTL: 60,
    
    // Disable image optimization in development for faster builds
    unoptimized: false,
  },

  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Experimental features for performance
  experimental: {
    // Enable optimized package imports
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash',
    ],
  },

  // Turbopack configuration (moved out of experimental)
  turbopack: {
    rules: {
      // Configure custom rules if needed
    },
  },

  // Asset optimization
  compress: true,
  
  // Asset headers for caching
  async headers() {
    return [
      {
        // Cache static assets
        source: '/public/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache images
        source: '/(.*\\.(?:jpg|jpeg|png|webp|avif|gif|svg))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache fonts
        source: '/(.*\\.(?:woff|woff2|eot|ttf|otf))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Bundle analyzer configuration (enable when needed)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config: any) => {
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
            generateStatsFile: true,
            statsFilename: 'stats.json',
          })
        );
      }
      return config;
    },
  }),

  // Output configuration for static builds
  output: 'standalone',
  
  // Enable strict mode for better performance
  reactStrictMode: true,
  
  // PoweredBy header removal for security
  poweredByHeader: false,
  
  // Note: optimizeFonts is deprecated in Next.js 15+ and enabled by default
};

export default nextConfig;
