/**
 * Loading Components
 *
 * Reusable loading states for better UX
 */

/**
 * Spinner Component
 * A simple animated spinner for loading states
 */
export function Spinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="animate-spin rounded-full border-4 border-gray-200 border-t-purple-600 w-full h-full"></div>
    </div>
  );
}

/**
 * Loading Skeleton
 * Placeholder for content that's loading
 */
export function Skeleton({ className = "", width = "100%", height = "20px" }: { className?: string; width?: string; height?: string }) {
  return (
    <div
      className={`bg-gray-200 animate-pulse rounded ${className}`}
      style={{ width, height }}
    />
  );
}

/**
 * Card Loading Skeleton
 * Skeleton for card-based layouts
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <Skeleton height="24px" width="60%" />
      <Skeleton height="16px" width="100%" />
      <Skeleton height="16px" width="90%" />
      <Skeleton height="16px" width="75%" />
    </div>
  );
}

/**
 * Table Loading Skeleton
 * Skeleton for table layouts
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton width="20%" height="16px" />
          <Skeleton width="30%" height="16px" />
          <Skeleton width="25%" height="16px" />
          <Skeleton width="25%" height="16px" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full Page Loading
 * Loading state for entire page
 */
export function PageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 text-lg">{message}</p>
      </div>
    </div>
  );
}

/**
 * Inline Loading
 * Small loading indicator for inline use
 */
export function InlineLoading({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex items-center space-x-2 text-gray-600">
      <Spinner size="sm" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

/**
 * Button Loading State
 * Loading indicator for buttons
 */
export function ButtonLoading() {
  return (
    <div className="flex items-center justify-center">
      <Spinner size="sm" className="mr-2" />
      <span>Processing...</span>
    </div>
  );
}
