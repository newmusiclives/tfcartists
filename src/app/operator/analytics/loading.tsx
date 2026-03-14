import { StatsSkeleton, TableSkeleton, CardSkeleton } from "@/components/loading-skeleton";

export default function OperatorAnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />

        {/* KPI stats row */}
        <StatsSkeleton count={4} />

        {/* Charts area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart placeholder 1 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-48 bg-gray-100 rounded animate-pulse" />
          </div>
          {/* Chart placeholder 2 */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="h-5 w-36 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-48 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Data table */}
        <TableSkeleton rows={6} columns={5} />
      </div>
    </div>
  );
}
