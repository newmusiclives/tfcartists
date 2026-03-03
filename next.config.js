/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["next-auth"],
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "truefans-radio.netlify.app",
      },
      {
        protocol: "https",
        hostname: "**.netlify.app",
      },
      {
        protocol: "https",
        hostname: "i.scdn.co", // Spotify album art
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
