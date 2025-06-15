import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // TypeScript configuration
  typescript: {
    // Temporarily ignore build errors during active development
    ignoreBuildErrors: false,
  },

  // ESLint configuration  
  eslint: {
    // Don't run ESLint during builds to prevent warnings from blocking development
    ignoreDuringBuilds: true,
  },

  // Only use webpack config when NOT using Turbopack
  webpack: (config, { isServer: _isServer, dev }) => {
    // Skip webpack customizations when using Turbopack to avoid conflicts
    if (process.env.NODE_ENV === 'development' && process.argv.includes('--turbopack')) {
      return config;
    }
    
    if (dev) {
      // Development optimizations
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    
    // Optimize bundle size for production
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }
    
    return config;
  },
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    domains: [], // Add external domains if needed
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Environment variables (ensure they're properly exposed)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  
  // Performance optimizations using Next.js 15 features
  experimental: {
    // Package import optimizations for better bundle splitting
    optimizePackageImports: [
      '@supabase/ssr',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tabs',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-select',
      'lucide-react',
      'date-fns',
      'recharts',
    ],
    // Try disabling CSS chunking to resolve CSS preloading issues
    cssChunking: false,
    // Enable server component external packages
    serverComponentsExternalPackages: ['@supabase/ssr'],
    // Temporarily disable force transforms to resolve build issues
    // forceSwcTransforms: true,
  },
  
  // Turbopack configuration (Next.js 15 stable configuration)
  // Temporarily disabled to resolve build issues
  // turbopack: {
  //   // Enable CSS optimization for better performance
  //   // Note: memoryLimit is not a valid option in stable Turbopack
  // },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Output optimization for deployment
  // output: 'standalone', // Temporarily disabled to avoid prerendering issues
  
  // Enable compression for better performance
  compress: true,
  
  // Asset optimization
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.ASSET_PREFIX : undefined,
  
  // Static file handling optimization
  trailingSlash: false,
  
  // Headers for better security and caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          {
            key: 'Content-Type',
            value: 'image/x-icon',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)\\.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Content-Type',
            value: 'image/svg+xml',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/(.*)\\.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, stale-while-revalidate=86400',
          },
          {
            key: 'Content-Type',
            value: 'text/plain',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects for better SEO (if needed)
  async redirects() {
    return [];
  },

  // Rewrites for API routing (if needed) 
  async rewrites() {
    return [];
  },
};

export default nextConfig;
