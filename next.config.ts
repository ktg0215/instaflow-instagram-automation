import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  experimental: {
    optimizeCss: true,
    optimizeServerReact: true,
    optimizePackageImports: ['lucide-react', '@google/generative-ai'],
  },
  
  // Bundle optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  
  // Performance headers
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  webpack: (config, { isServer, webpack }) => {
    // Server-side configuration - allow pg modules
    if (isServer) {
      // Ensure server-only packages are external (but available)
      if (!config.externals) {
        config.externals = [];
      }
      if (Array.isArray(config.externals)) {
        config.externals.push('pg-native');
      }
    } else {
      // Client-side configuration - completely exclude server modules
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        dns: false,
        child_process: false,
        module: false,
        pg: false,
        'pg-native': false,
        'pg-connection-string': false,
      };
      
      // Only ignore on client side
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(pg|pg-connection-string)$/,
          contextRegExp: /^(?!.*server)/,
        })
      );
      
      // Alias database modules to false on client side only
      config.resolve.alias = {
        ...config.resolve.alias,
        'pg': false,
        'pg-native': false,
        'pg-connection-string': false,
      };
    }
    
    return config;
  },
  
  // External packages for server-side only (but still available for import)
  serverExternalPackages: ['pg-native']
};

export default nextConfig;
