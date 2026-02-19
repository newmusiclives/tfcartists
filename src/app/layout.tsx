import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RadioPlayer } from "@/components/radio-player";
import { StationProvider } from "@/contexts/StationContext";

const inter = Inter({ subsets: ["latin"] });

// Allow ISR with 60-second revalidation for better performance
export const revalidate = 60;

export const metadata: Metadata = {
  title: "TrueFans RADIO Network",
  description: "AI-powered radio stations championing independent artists",
  manifest: "/manifest.json",
  themeColor: "#78350f",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TrueFans RADIO",
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
        <StationProvider>
          <div className="pb-24">{children}</div>
          <RadioPlayer />
        </StationProvider>
      </body>
    </html>
  );
}
