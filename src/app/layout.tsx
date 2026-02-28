import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RadioPlayer } from "@/components/radio-player";
import { SentryInit } from "@/components/sentry-init";
import { StationProvider } from "@/contexts/StationContext";
import { ToastProvider } from "@/contexts/ToastContext";

const inter = Inter({ subsets: ["latin"] });

// Allow ISR with 60-second revalidation for better performance
export const revalidate = 60;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#78350f",
};

export const metadata: Metadata = {
  title: {
    default: "TrueFans RADIO | AI-Powered Independent Radio",
    template: "%s | TrueFans RADIO",
  },
  description:
    "24/7 AI-powered radio championing independent artists. 92% of every dollar goes directly to artists. Listen live, earn rewards, and discover new music.",
  keywords: [
    "independent radio",
    "indie music",
    "artist support",
    "AI radio",
    "music discovery",
    "TrueFans",
    "americana",
    "country music",
    "live radio",
  ],
  manifest: "/manifest.json",
  metadataBase: new URL("https://truefans-radio.netlify.app"),
  alternates: {
    canonical: "/",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TrueFans RADIO",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "TrueFans RADIO | Where the Music Finds You",
    description:
      "24/7 AI-powered radio championing independent artists. 92% of every dollar goes directly to artists. Listen live, earn rewards, and discover new music.",
    url: "https://truefans-radio.netlify.app",
    siteName: "TrueFans RADIO",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueFans RADIO | Where the Music Finds You",
    description:
      "24/7 AI-powered radio championing independent artists. 92% goes to artists. Listen live & earn rewards.",
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
