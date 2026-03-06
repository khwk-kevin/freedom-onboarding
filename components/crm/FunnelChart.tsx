'use client';

interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

interface FunnelChartProps {
  stages: FunnelStage[];
}

export function FunnelChart({ stages }: FunnelChartProps) {
  const maxValue = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-6">Onboarding Funnel</h3>
      <div className="space-y-4">
        {stages.map((stage, index) => {
          const widthPct = Math.max((stage.value / maxValue) * 100, 4);
          const prev = stages[index - 1];
          const dropoffPct =
            prev && prev.value > 0
              ? Math.round((1 - stage.value / prev.value) * 100)
              : null;

          return (
            <div key={stage.label}>
              {dropoffPct !== null && dropoffPct > 0 && (
                <div className="flex items-center gap-2 pl-28 mb-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" className="text-red-300 shrink-0">
                    <path d="M6 2 L6 10 M3 7 L6 10 L9 7" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-xs text-red-400">−{dropoffPct}% drop-off</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 w-24 shrink-0 text-right">
                  {stage.label}
                </span>
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-full h-9 w-full">
                    <div
                      className="h-9 rounded-full flex items-center px-3 transition-all duration-700 min-w-[32px]"
                      style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
                    >
                      <span className="text-white text-xs font-bold drop-shadow-sm">
                        {stage.value}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stages.length >= 2 && stages[0].value > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">Lead → Active conversion</p>
          <span className="text-sm font-bold text-gray-900">
            {Math.round((stages[stages.length - 1].value / stages[0].value) * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
