/**
 * Client-side Sentry initialization.
 * Uses @sentry/browser for error tracking in the browser.
 * Server-side errors are reported via the lightweight HTTP API in logger.ts.
 */
import * as Sentry from "@sentry/browser";

let initialized = false;

export function initSentry() {
  if (initialized) return;
  if (typeof window === "undefined") return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || "production",
    enabled: process.env.NODE_ENV === "production",
    // Higher sampling during initial launch to catch issues early.
    // Reduce to 0.1 once stable with significant traffic.
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    beforeSend(event) {
      // Strip PII from error reports
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      return event;
    },
  });

  initialized = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (typeof window !== "undefined" && initialized) {
    Sentry.captureException(error, { extra: context });
  }
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  if (typeof window !== "undefined" && initialized) {
    Sentry.captureMessage(message, level);
  }
}
