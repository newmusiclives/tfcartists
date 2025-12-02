"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, CheckCircle, MessageCircle } from "lucide-react";

export default function OnboardSuccessPage() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "there";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to TrueFans CONNECT, {name}!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            You're all set! Riley will reach out to you shortly to help you get ready for your
            next show.
          </p>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-8">
            <div className="flex items-start space-x-4">
              <MessageCircle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
              <div className="text-left">
                <div className="font-semibold text-purple-900 mb-2">What happens next?</div>
                <ul className="text-sm text-purple-800 space-y-2">
                  <li>✓ Riley will send you a friendly text message</li>
                  <li>✓ She'll walk you through the 9-word line</li>
                  <li>✓ You'll get reminders before your show</li>
                  <li>✓ We'll celebrate your first win together!</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold inline-flex items-center justify-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              View Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
