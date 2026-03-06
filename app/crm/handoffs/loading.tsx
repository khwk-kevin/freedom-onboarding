export default function HandoffsLoading() {
  return (
    <div className="p-4 sm:p-8 animate-pulse" aria-busy="true" aria-label="Loading handoffs">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="h-7 bg-gray-200 rounded w-28 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-44" />
        </div>
        <div className="h-5 bg-gray-200 rounded-full w-16" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-200 rounded-full w-24" />
        ))}
      </div>

      {/* Handoff cards */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full shrink-0" />
                <div>
                  <div className="h-4 bg-gray-200 rounded w-36 mb-1.5" />
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
              </div>
              <div className="h-6 bg-gray-200 rounded-full w-20" />
            </div>
            <div className="h-12 bg-gray-100 rounded w-full mb-3" />
            <div className="flex gap-3">
              <div className="h-8 bg-gray-200 rounded-lg w-28" />
              <div className="h-8 bg-gray-100 rounded-lg w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
