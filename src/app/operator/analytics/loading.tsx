export default function OperatorAnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Header skeleton */}
      <header className="bg-white dark:bg-zinc-900 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
              <div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. Summary stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-5 animate-pulse"
            >
              <div className="h-3 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-7 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-2.5 w-24 bg-gray-100 rounded" />
            </div>
          ))}
        </div>

        {/* 2. Listener trend chart */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6 animate-pulse">
          <div className="h-5 w-52 bg-gray-200 rounded mb-2" />
          <div className="h-3 w-32 bg-gray-100 rounded mb-5" />
          <div className="flex items-end justify-between gap-2" style={{ height: 180 }}>
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className="w-full max-w-[48px] bg-gray-200 rounded-t-md"
                  style={{ height: 40 + Math.random() * 100 }}
                />
                <div className="mt-2 h-3 w-8 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* 3 & 4. Pipeline funnels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6 animate-pulse"
            >
              <div className="h-5 w-40 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-48 bg-gray-100 rounded mb-5" />
              <div className="space-y-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j}>
                    <div className="flex justify-between mb-1">
                      <div className="h-3 w-20 bg-gray-200 rounded" />
                      <div className="h-3 w-12 bg-gray-200 rounded" />
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 5. Top songs table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6 animate-pulse">
          <div className="h-5 w-44 bg-gray-200 rounded mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-100 rounded" />
            ))}
          </div>
        </div>

        {/* 6. Revenue breakdown */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border p-6 animate-pulse">
          <div className="h-5 w-40 bg-gray-200 rounded mb-5" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-36 bg-gray-200 rounded" />
                  <div className="h-4 w-16 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
