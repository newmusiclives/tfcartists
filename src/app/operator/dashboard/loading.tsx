import { StatsSkeleton, CardSkeleton, TableSkeleton } from "@/components/loading-skeleton";

export default function OperatorDashboardLoading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Header skeleton */}
      <header className="bg-white dark:bg-zinc-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              <div>
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-1" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Station overview card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            <div>
              <div className="h-7 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-1" />
            </div>
          </div>
          <StatsSkeleton count={4} />
        </div>

        {/* Network stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6">
              <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <CardSkeleton lines={4} />
      </div>
    </main>
  );
}
