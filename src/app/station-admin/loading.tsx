import { StatsSkeleton, CardSkeleton } from "@/components/loading-skeleton";

export default function StationAdminLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />

        {/* Station info card */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div>
              <div className="h-6 w-44 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-28 bg-gray-200 rounded animate-pulse mt-1" />
            </div>
          </div>
          <StatsSkeleton count={4} />
        </div>

        {/* Action cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} lines={2} />
          ))}
        </div>
      </div>
    </div>
  );
}
