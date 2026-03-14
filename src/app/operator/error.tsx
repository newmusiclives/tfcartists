"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCcw } from "lucide-react";

export default function OperatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Operator error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
          <AlertCircle className="w-10 h-10 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Operator Dashboard Error</h1>
        <p className="text-gray-600 mb-6">
          Something went wrong loading the operator panel. Please try again.
        </p>

        {process.env.NODE_ENV === "development" && (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
            <p className="text-sm font-mono text-gray-700 break-words">
              <strong>Error:</strong> {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-500 mt-1">Digest: {error.digest}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            <RefreshCcw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center space-x-2 border-2 border-purple-300 text-purple-700 px-6 py-3 rounded-lg hover:border-purple-400 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
