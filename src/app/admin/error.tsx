"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RefreshCcw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
          <AlertCircle className="w-10 h-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard Error</h1>
        <p className="text-gray-600 mb-6">Something went wrong loading the admin dashboard.</p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center space-x-2 bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors font-medium"
          >
            <RefreshCcw className="w-5 h-5" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center space-x-2 border-2 border-amber-300 text-amber-700 px-6 py-3 rounded-lg hover:border-amber-400 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
