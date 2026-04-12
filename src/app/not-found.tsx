import Link from "next/link";
import { Home, Radio, Headphones, Calendar, Music } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <Radio className="w-16 h-16 text-amber-600 mx-auto mb-4" />
        <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-4">
          404
        </div>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>

        <p className="text-lg text-gray-600 dark:text-zinc-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center space-x-2 bg-amber-700 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            <span>Go Home</span>
          </Link>

          <div className="flex gap-3 justify-center">
            <Link
              href="/player"
              className="inline-flex items-center space-x-1 text-amber-700 hover:text-amber-900 text-sm font-medium"
            >
              <Headphones className="w-4 h-4" />
              <span>Listen Live</span>
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center space-x-1 text-amber-700 hover:text-amber-900 text-sm font-medium"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule</span>
            </Link>
            <Link
              href="/onboard"
              className="inline-flex items-center space-x-1 text-amber-700 hover:text-amber-900 text-sm font-medium"
            >
              <Music className="w-4 h-4" />
              <span>Submit Music</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
