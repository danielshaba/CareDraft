import { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: true, // Remove after fixing all TS issues
  },
  eslint: {
    ignoreDuringBuilds: true, // Remove after fixing all ESLint issues
  },

  // Webpack configuration for code splitting optimization
  webpack: (config, { isServer }) => {
    // Optimize chunk splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: 'all',
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Vendor chunk for third-party libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
            // Framework chunk for React and Next.js
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'framework',
              priority: 40,
              chunks: 'all',
              enforce: true,
            },
            // UI library chunk for large UI components
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|@tiptap|@hello-pangea)[\\/]/,
              name: 'ui-libs',
              priority: 30,
              chunks: 'all',
            },
            // Supabase chunk for database operations
            supabase: {
              test: /[\\/]node_modules[\\/](@supabase)[\\/]/,
              name: 'supabase',
              priority: 25,
              chunks: 'all',
            },
            // Common chunks for shared code
            common: {
              minChunks: 2,
              priority: 5,
              chunks: 'all',
              name: 'common',
              enforce: true,
            },
          },
        },
      };
    }

    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Headers for asset caching
  async headers() {
    return [
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Package optimizations
  optimizePackageImports: [
    'lucide-react',
    '@radix-ui/react-icons',
    'date-fns',
    'lodash',
  ],

  // Server external packages (renamed from experimental.serverComponentsExternalPackages in Next.js 15)
  serverExternalPackages: ['canvas', 'jsdom'],

  // Turbopack configuration (if you are using it)
  // Note: Turbopack configuration might differ.
  // This is a placeholder for SVGR with Turbopack.
  experimental: {
    turbopack: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
};

module.exports = withBundleAnalyzer(nextConfig); 