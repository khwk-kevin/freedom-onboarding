export default function MerchantsLoading() {
  return (
    <div className="p-4 sm:p-8 animate-pulse" aria-busy="true" aria-label="Loading merchants">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-48" />
        </div>
        <div className="h-9 bg-gray-200 rounded-lg w-24" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded-full w-20" />
        ))}
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Table header */}
        <div className="flex gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
          {[140, 100, 80, 80, 60].map((w, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: w }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-4 items-center px-6 py-4 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
              <div>
                <div className="h-4 bg-gray-200 rounded w-32 mb-1" />
                <div className="h-3 bg-gray-100 rounded w-48" />
              </div>
            </div>
            <div className="h-5 bg-gray-200 rounded-full w-20" />
            <div className="h-4 bg-gray-100 rounded w-16" />
            <div className="h-4 bg-gray-100 rounded w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
