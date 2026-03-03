import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RadioPlayer } from "@/components/radio-player";
import { SentryInit } from "@/components/sentry-init";
import { WebVitalsInit } from "@/components/web-vitals-init";
import { CsrfProvider } from "@/components/csrf-provider";
import { StationProvider } from "@/contexts/StationContext";
import { ToastProvider } from "@/contexts/ToastContext";

const inter = Inter({ subsets: ["latin"] });

// Allow ISR with 60-second revalidation for better performance
export const revalidate = 60;

// Configurable branding — operators can override via environment variables.
// In a multi-station network, each deployment sets these per-operator.
const NETWORK_NAME = process.env.NEXT_PUBLIC_NETWORK_NAME || "TrueFans RADIO";
const STATION_NAME = process.env.NEXT_PUBLIC_STATION_NAME || "North Country Radio";
const STATION_TAGLINE = process.env.NEXT_PUBLIC_STATION_TAGLINE || "Where the Music Finds You";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://truefans-radio.netlify.app";
const THEME_COLOR = process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#78350f";
const SITE_DESCRIPTION =
  process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
  "24/7 AI-powered radio championing independent artists. 92% of every dollar goes directly to artists. Listen live, earn rewards, and discover new music.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: THEME_COLOR,
};

export const metadata: Metadata = {
  title: {
    default: `${NETWORK_NAME} | AI-Powered Independent Radio`,
    template: `%s | ${NETWORK_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "independent radio",
    "indie music",
    "artist support",
    "AI radio",
    "music discovery",
    NETWORK_NAME,
    "live radio",
  ],
  manifest: "/manifest.json",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: NETWORK_NAME,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: `${NETWORK_NAME} | ${STATION_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: NETWORK_NAME,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${NETWORK_NAME} | ${STATION_TAGLINE}`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SentryInit />
        <WebVitalsInit />
        <CsrfProvider />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-amber-700 focus:text-white focus:px-4 focus:py-2 focus:rounded">
          Skip to main content
        </a>
        <StationProvider>
          <ToastProvider>
            <div id="main-content" className="pb-24">{children}</div>
            <RadioPlayer />
          </ToastProvider>
        </StationProvider>
      </body>
    </html>
  );
}
