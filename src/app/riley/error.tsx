"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCcw } from "lucide-react";
import { logger } from "@/lib/logger";

export default function RileyError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Riley error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 dark:from-green-950 via-white dark:via-zinc-900 to-emerald-50 dark:to-emerald-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-6">
          <AlertCircle className="w-10 h-10 text-green-600 dark:text-green-300" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Riley Dashboard Error</h1>
        <p className="text-gray-600 dark:text-zinc-400 mb-6">
          Something went wrong loading the artist relations dashboard. Please try again.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-zinc-800 rounded-lg text-left">
            <p className="text-sm font-mono text-gray-700 dark:text-zinc-200 break-words">
              <strong>Error:</strong> {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-600 dark:text-zinc-400 mt-1">Digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center space-x-2 bg-green-700 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <RefreshCcw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center space-x-2 border-2 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 px-6 py-3 rounded-lg hover:border-green-400 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
