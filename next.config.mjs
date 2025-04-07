/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['sqlite3'],
  },
  webpack: (config) => {
    // Add SQLite3 for the runtime
    if (!config.externals) config.externals = [];
    config.externals.push('sqlite3');
    
    return config;
  },
};

export default nextConfig;
