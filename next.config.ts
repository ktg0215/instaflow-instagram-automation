import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
