"use client";

import Link from "next/link";
import { Radio, CheckCircle, ArrowRight } from "lucide-react";
import { useStation } from "@/contexts/StationContext";

export default function SponsorThankYouPage() {
  const { currentStation } = useStation();

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h1>

        <p className="text-lg text-gray-600 mb-8">
          Your sponsorship inquiry has been received. Our team at {currentStation.name} will review your application and reach out within 2-3 business days.
        </p>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 text-left">
          <h2 className="font-semibold text-gray-900 mb-3">What happens next?</h2>
          <ol className="space-y-3 text-sm text-gray-600">
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <span>Our sponsorship team reviews your inquiry</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <span>We&apos;ll schedule a call to discuss your goals and the best sponsorship fit</span>
            </li>
            <li className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <span>Customize your sponsorship package and go live on-air</span>
            </li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center space-x-2 text-green-700 hover:text-green-800 font-medium transition-colors"
          >
            <Radio className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>
          <Link
            href="/player"
            className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <span>Listen Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
