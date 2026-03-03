/**
 * Web Vitals Reporting
 *
 * Tracks Core Web Vitals (LCP, FID, CLS, TTFB, INP) and reports
 * them to the console in development, and to analytics in production.
 */

type WebVitalMetric = {
  id: string;
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta: number;
  navigationType: string;
};

/**
 * Report Web Vital to analytics/logging.
 * In production, this can be wired to an analytics endpoint.
 */
function reportVital(metric: WebVitalMetric) {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const color =
      metric.rating === "good"
        ? "\x1b[32m" // green
        : metric.rating === "needs-improvement"
          ? "\x1b[33m" // yellow
          : "\x1b[31m"; // red
    console.log(
      `${color}[Web Vital] ${metric.name}: ${metric.value.toFixed(1)} (${metric.rating})\x1b[0m`
    );
    return;
  }

  // Production: send to analytics endpoint
  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
      page: window.location.pathname,
    });
    navigator.sendBeacon("/api/analytics/vitals", body);
  }
}

/**
 * Initialize Web Vitals tracking.
 * Call this once in the root layout or app component.
 */
export function initWebVitals() {
  if (typeof window === "undefined") return;

  // Use dynamic import to avoid bundling web-vitals when not available
  import("web-vitals")
    .then(({ onCLS, onLCP, onTTFB, onINP }) => {
      onCLS(reportVital as any);
      onLCP(reportVital as any);
      onTTFB(reportVital as any);
      onINP(reportVital as any);
    })
    .catch(() => {
      // web-vitals not installed — that's OK, it's optional
    });
}
