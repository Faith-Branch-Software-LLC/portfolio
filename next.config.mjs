/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',

  // Forces Next.js to follow symlinks for local file: dependencies
  transpilePackages: ['gsap-offset-path'],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      };
    }
    return config;
  },
};

export default nextConfig;
