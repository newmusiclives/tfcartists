/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["next-auth"],
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
