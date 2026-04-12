"use client";

import { useState, useEffect, useCallback } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isiOS);

    // Check if user has dismissed in the last 7 days
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000) return;

    // Chrome/Android: Listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Always show the banner after a delay — don't gate on beforeinstallprompt
    // Chrome's event is unreliable; we fall back to manual install instructions
    const timer = setTimeout(() => setShowBanner(true), isiOS ? 30000 : 8000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      // Native Chrome install prompt available
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Show manual install guide
      setShowGuide(true);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowGuide(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  }, []);

  if (!showBanner) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-slide-in">
        <div className="bg-white rounded-xl shadow-2xl border border-amber-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">Install TrueFans RADIO</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-500">Listen anywhere, get notifications</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleInstall}
            className="w-full bg-amber-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-700 transition-colors"
          >
            {isIOS ? "How to Install" : "Install App"}
          </button>
        </div>
      </div>

      {/* Installation Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm mx-0 sm:mx-4 p-6 animate-slide-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {isIOS ? "Install on iOS" : "Install TrueFans RADIO"}
              </h3>
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {isIOS ? (
              <ol className="space-y-4 text-sm text-gray-700 dark:text-zinc-300">
                <li className="flex items-start space-x-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex-shrink-0">1</span>
                  <span>Tap the <strong>Share</strong> button in Safari (the square with an arrow pointing up)</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex-shrink-0">2</span>
                  <span>Scroll down and tap <strong>&ldquo;Add to Home Screen&rdquo;</strong></span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex-shrink-0">3</span>
                  <span>Tap <strong>&ldquo;Add&rdquo;</strong> to install the app</span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-4 text-sm text-gray-700 dark:text-zinc-300">
                <li className="flex items-start space-x-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex-shrink-0">1</span>
                  <span>Click the <strong>install icon</strong> in the address bar (monitor with a down arrow), or open Chrome&apos;s menu (<strong>three dots</strong> at top right)</span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex-shrink-0">2</span>
                  <span>Select <strong>&ldquo;Install TrueFans RADIO&rdquo;</strong> or <strong>&ldquo;Save and Share &gt; Install&rdquo;</strong></span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex-shrink-0">3</span>
                  <span>Click <strong>&ldquo;Install&rdquo;</strong> to add the app to your desktop</span>
                </li>
              </ol>
            )}
            <button
              onClick={handleDismiss}
              className="w-full mt-6 bg-amber-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-amber-700 transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
