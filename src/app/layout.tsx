import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { RadioPlayerWrapper } from "@/components/radio-player-wrapper";
import { SentryInit } from "@/components/sentry-init";
import { WebVitalsInit } from "@/components/web-vitals-init";
import { CsrfProvider } from "@/components/csrf-provider";
import { SessionProvider } from "@/components/session-provider";
import { ServiceWorkerRegister } from "@/components/sw-register";
import { ErrorBoundary } from "@/lib/monitoring/error-boundary";
import { sanitizeHtml } from "@/lib/sanitize";
import { resolveBranding } from "@/lib/branding-resolver";
import { BrandProvider } from "@/components/brand-provider";
import dynamic from "next/dynamic";
const PWAInstallPrompt = dynamic(() => import("@/components/pwa-install-prompt").then(m => ({ default: m.PWAInstallPrompt })), { ssr: false });
const DJChat = dynamic(() => import("@/components/dj-chat"), { ssr: false });
const OfflineBanner = dynamic(() => import("@/components/offline-banner").then(m => ({ default: m.OfflineBanner })), { ssr: false });
import { MobileNav } from "@/components/mobile-nav";
import { StationProvider } from "@/contexts/StationContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

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
  "24/7 independent radio championing independent artists. 92% of every dollar goes directly to artists. Listen live, earn rewards, and discover new music.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: THEME_COLOR,
};

export const metadata: Metadata = {
  title: {
    default: `${NETWORK_NAME} | Independent Radio for Real Music`,
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
    images: [
      {
        url: "/logos/ncr-og.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${NETWORK_NAME} | ${STATION_TAGLINE}`,
    description: SITE_DESCRIPTION,
    images: ["/logos/ncr-og.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// GoHighLevel Chat Widget ID — set in GHL > Sites > Chat Widget > Install
const GHL_WIDGET_ID = process.env.NEXT_PUBLIC_GHL_WIDGET_ID || "";

// Analytics — GoHighLevel tracking or Google Analytics
const GHL_TRACKING_ID = process.env.NEXT_PUBLIC_GHL_TRACKING_ID || "";
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Resolve white-label branding for the current request
  let branding;
  try {
    branding = await resolveBranding();
  } catch {
    branding = null;
  }

  const faviconUrl = branding?.favicon || "/icons/icon-192.png";
  const themeColor = branding?.colors?.primary || THEME_COLOR;
  const resolvedName = branding?.stationName || NETWORK_NAME;

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}` }} />
        {/* Dynamic favicon from white-label branding */}
        {branding?.favicon && (
          <link rel="icon" href={branding.favicon} />
        )}
        {/* Dynamic theme-color */}
        <meta name="theme-color" content={themeColor} />
        {/* GoHighLevel Tracking Script */}
        {GHL_TRACKING_ID && (
          <script
            async
            src={`https://link.msgsndr.com/js/tracking.js?v=${GHL_TRACKING_ID}`}
          />
        )}

        {/* Google Analytics (fallback if no GHL tracking) */}
        {GA_MEASUREMENT_ID && !GHL_TRACKING_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`),
              }}
            />
          </>
        )}
      </head>
      <body className={inter.className}>
        <SentryInit />
        <WebVitalsInit />
        <CsrfProvider />
        <ServiceWorkerRegister />
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:bg-amber-700 focus:text-white focus:px-4 focus:py-2 focus:rounded">
          Skip to main content
        </a>
        <ErrorBoundary>
          <SessionProvider>
            <BrandProvider orgId={branding?.orgId || undefined}>
            <LanguageProvider>
            <StationProvider>
              <ToastProvider>
                <RadioPlayerWrapper>{children}</RadioPlayerWrapper>
                <MobileNav />
                <DJChat />
                <OfflineBanner />
                <PWAInstallPrompt />
              </ToastProvider>
            </StationProvider>
            </LanguageProvider>
            </BrandProvider>
          </SessionProvider>
        </ErrorBoundary>

        {/* GoHighLevel Live Chat Widget */}
        {GHL_WIDGET_ID && (
          <script
            src="https://widgets.leadconnectorhq.com/loader.js"
            data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
            data-widget-id={GHL_WIDGET_ID}
            async
          />
        )}
      </body>
    </html>
  );
}
