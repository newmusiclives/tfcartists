"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Register service worker after page load to avoid blocking initial render
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        // Listen for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "activated" &&
              navigator.serviceWorker.controller
            ) {
              // New service worker activated — content has been cached for offline use
              console.log("[SW] Updated and activated");
            }
          });
        });

        // Register periodic background sync for now-playing (if supported)
        if ("periodicSync" in registration) {
          try {
            const status = await navigator.permissions.query({
              // @ts-expect-error — periodicSync is not yet in the TS Permission typings
              name: "periodic-background-sync",
            });
            if (status.state === "granted") {
              await (registration as unknown as { periodicSync: { register: (tag: string, options: { minInterval: number }) => Promise<void> } }).periodicSync.register(
                "tfr-now-playing",
                { minInterval: 60 * 1000 } // 1 minute minimum
              );
              console.log("[SW] Periodic background sync registered");
            }
          } catch {
            // Periodic sync not available — that's fine
          }
        }

        console.log("[SW] Registered with scope:", registration.scope);
      } catch (error) {
        console.warn("[SW] Registration failed:", error);
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    // When coming back online, sync any queued offline actions
    const handleOnline = async () => {
      try {
        const { syncAll } = await import("@/lib/offline-store");
        const synced = await syncAll();
        if (synced > 0) {
          console.log(`[SW] Online — synced ${synced} queued actions`);
        }
      } catch (err) {
        console.warn("[SW] Online sync failed:", err);
      }
    };

    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}
