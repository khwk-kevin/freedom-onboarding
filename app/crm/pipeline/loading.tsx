export default function PipelineLoading() {
  const columns = ['Lead', 'Onboarding', 'Onboarded', 'Active', 'Dormant'];

  return (
    <div className="p-4 sm:p-8 animate-pulse" aria-busy="true" aria-label="Loading pipeline">
      {/* Header */}
      <div className="mb-6">
        <div className="h-7 bg-gray-200 rounded w-36 mb-2" />
        <div className="h-4 bg-gray-100 rounded w-52" />
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div
            key={col}
            className="shrink-0 w-64 bg-gray-100 rounded-xl p-4"
          >
            {/* Column header */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 bg-gray-200 rounded w-24" />
              <div className="h-5 bg-gray-200 rounded-full w-8" />
            </div>
            {/* Cards */}
            {Array.from({ length: Math.floor(Math.random() * 3) + 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4 mb-3 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
