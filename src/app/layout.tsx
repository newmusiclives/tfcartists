import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RadioPlayer } from "@/components/radio-player";
import { StationProvider } from "@/contexts/StationContext";

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
  title: "TrueFans RADIO Network",
  description: "AI-powered radio stations championing independent artists",
  manifest: "/manifest.json",
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
    title: "TrueFans RADIO Network",
    description: "AI-powered radio stations championing independent artists",
    url: "https://truefans-radio.netlify.app",
    siteName: "TrueFans RADIO",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrueFans RADIO Network",
    description: "AI-powered radio stations championing independent artists",
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
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-amber-700 focus:text-white focus:px-4 focus:py-2 focus:rounded">
          Skip to main content
        </a>
        <StationProvider>
          <div id="main-content" className="pb-24">{children}</div>
          <RadioPlayer />
        </StationProvider>
      </body>
    </html>
  );
}
