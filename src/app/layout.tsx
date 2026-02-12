import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RadioPlayer } from "@/components/radio-player";

const inter = Inter({ subsets: ["latin"] });

// Force dynamic rendering for all pages to prevent build-time data collection
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "North Country Radio — TrueFans RADIO Network",
  description: "AI-powered Americana and Country radio station championing independent artists",
  manifest: "/manifest.json",
  themeColor: "#78350f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NCR Radio",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
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
        <div className="pb-16">{children}</div>
        <RadioPlayer />
      </body>
    </html>
  );
}
