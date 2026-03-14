"use client";

import Link from "next/link";
import { Radio, CheckCircle2 } from "lucide-react";

export default function UnsubscribedPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribed</h1>
        <p className="text-gray-600 mb-6">
          You have been successfully unsubscribed from our newsletter.
          You will no longer receive emails from us.
        </p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-amber-700 hover:text-amber-800 font-medium"
        >
          <Radio className="w-4 h-4" />
          <span>Back to TrueFans RADIO</span>
        </Link>
      </div>
    </main>
  );
}
