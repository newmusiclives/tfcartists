"use client";

import { useEffect } from "react";
import { initSentry } from "@/lib/sentry-client";

export function SentryInit() {
  useEffect(() => {
    initSentry();
  }, []);
  return null;
}
