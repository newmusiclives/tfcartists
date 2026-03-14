/**
 * Reusable loading skeleton components for Next.js loading.tsx files.
 * Uses Tailwind animate-pulse for shimmer effect.
 */

function Shimmer({ className }: { className?: string }) {
  return <div className={`bg-gray-200 rounded animate-pulse ${className || ""}`} />;
}

/**
 * Full page loading skeleton with header, stats row, and content area.
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page title */}
        <Shimmer className="h-8 w-56" />
        <Shimmer className="h-4 w-80" />

        {/* Stats row */}
        <StatsSkeleton />

        {/* Content cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* Table */}
        <TableSkeleton />
      </div>
    </div>
  );
}

/**
 * Single card placeholder with title and body lines.
 */
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <Shimmer className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer
            key={i}
            className={`h-4 ${i === lines - 1 ? "w-3/4" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Table rows placeholder with header and row shimmers.
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Table header */}
      <div className="border-b px-6 py-4">
        <Shimmer className="h-5 w-40" />
      </div>

      {/* Column headers */}
      <div className="px-6 py-3 border-b bg-gray-50">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Shimmer key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>

      {/* Rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, j) => (
                <Shimmer key={j} className="h-4 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * KPI / stats cards placeholder — a row of metric boxes.
 */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
          <Shimmer className="h-3 w-20 mb-3" />
          <Shimmer className="h-8 w-16 mb-2" />
          <Shimmer className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}
