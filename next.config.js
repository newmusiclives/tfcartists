/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["next-auth"],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    outputFileTracingIncludes: {
      '/**': ['./prisma/dev.db'],
    },
  },
};

module.exports = nextConfig;
