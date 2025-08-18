import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer, webpack }) => {
    // Server-side configuration
    if (isServer) {
      // Ensure server-only packages are external
      if (!config.externals) {
        config.externals = [];
      }
      if (Array.isArray(config.externals)) {
        config.externals.push('pg-native');
      }
    } else {
      // Client-side configuration - completely exclude server modules
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
      };
      
      // More aggressive exclusion with multiple methods
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(pg|pg-connection-string|pg-native|jsonwebtoken)$/,
        })
      );
      
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^\.\/lib\/database$/,
          contextRegExp: /lib/,
        })
      );
      
      // Alias everything to false
      config.resolve.alias = {
        ...config.resolve.alias,
        'pg': false,
        'pg-native': false,
        'pg-connection-string': false,
        'jsonwebtoken': false,
        // All possible database import paths
        '../lib/database': false,
        './lib/database': false,
        '@/lib/database': false,
        '../../lib/database': false,
        '../../../lib/database': false,
        '../../../../lib/database': false,
      };
      
      // Alternative: replace with empty module
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push({
          'pg': '{}',
          'pg-connection-string': '{}',
          'pg-native': '{}',
          'jsonwebtoken': '{}'
        });
      }
    }
    
    return config;
  },
  
  // External packages for server-side only  
  serverExternalPackages: ['pg', 'pg-connection-string', 'jsonwebtoken', 'pg-native']
};

export default nextConfig;
