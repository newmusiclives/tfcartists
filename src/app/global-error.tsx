"use client";

import * as Sentry from "@sentry/browser";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="en">
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fffbeb, #ffffff, #fff7ed)",
          padding: "1rem",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}>
          <div style={{
            maxWidth: "28rem",
            width: "100%",
            background: "white",
            borderRadius: "1rem",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
            padding: "2rem",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: "6rem",
              fontWeight: "bold",
              color: "#b45309",
              marginBottom: "1rem",
              lineHeight: 1,
            }}>
              500
            </div>

            <h1 style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              color: "#111827",
              marginBottom: "1rem",
            }}>
              Something Went Wrong
            </h1>

            <p style={{
              fontSize: "1rem",
              color: "#6b7280",
              marginBottom: "2rem",
            }}>
              An unexpected error occurred. Our team has been notified.
            </p>

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button
                onClick={reset}
                style={{
                  background: "#b45309",
                  color: "white",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontWeight: 500,
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  background: "#f3f4f6",
                  color: "#374151",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontSize: "1rem",
                }}
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
