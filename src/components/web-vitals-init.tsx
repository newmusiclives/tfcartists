"use client";

import { useEffect } from "react";

export function WebVitalsInit() {
  useEffect(() => {
    import("@/lib/web-vitals").then(({ initWebVitals }) => {
      initWebVitals();
    });
  }, []);

  return null;
}
