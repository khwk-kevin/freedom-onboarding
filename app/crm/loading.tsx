export default function CRMDashboardLoading() {
  return (
    <div className="p-4 sm:p-8 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-7 bg-gray-200 rounded w-40 mb-2" />
          <div className="h-4 bg-gray-100 rounded w-56" />
        </div>
        <div className="h-9 bg-gray-200 rounded-lg w-28" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>

      {/* Revenue cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-xl" />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-64 bg-gray-200 rounded-xl" />
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );
}
