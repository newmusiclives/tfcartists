/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["next-auth"],
  poweredByHeader: false,
  async redirects() {
    return [
      // Auth: NextAuth default path → custom login page
      { source: "/auth/signin", destination: "/login", permanent: true },
      { source: "/auth/sign-in", destination: "/login", permanent: true },
      // Legal: common alternate paths
      { source: "/legal/privacy", destination: "/privacy", permanent: true },
      { source: "/legal/terms", destination: "/terms", permanent: true },
      { source: "/legal/cookies", destination: "/cookies", permanent: true },
    ];
  },
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
      {
        // Artist portraits for the owned catalogue, served from Cloudflare R2
        // by TrueFans LABEL. Without this, next/image refuses the host and
        // every artist image 400s - which affects the now-playing artwork as
        // well as the artists page.
        protocol: "https",
        hostname: "**.r2.dev",
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
