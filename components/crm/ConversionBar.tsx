'use client';

interface Stage {
  id: string;
  label: string;
  count: number;
  color: string;
}

interface ConversionBarProps {
  stages: Stage[];
}

export function ConversionBar({ stages }: ConversionBarProps) {
  const activeStages = stages.filter((s) => s.count > 0 || stages.indexOf(s) === 0);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2.5 overflow-x-auto">
      <div className="flex items-center gap-0 min-w-max">
        {stages.map((stage, i) => {
          const nextStage = stages[i + 1];
          const convRate = nextStage && stage.count > 0
            ? Math.round((nextStage.count / stage.count) * 100)
            : null;

          return (
            <div key={stage.id} className="flex items-center">
              {/* Stage pill */}
              <div className="flex flex-col items-center px-3 py-1">
                <div
                  className="text-[11px] font-semibold px-3 py-1 rounded-full text-white"
                  style={{ backgroundColor: stage.color }}
                >
                  {stage.count}
                </div>
                <span className="text-[10px] text-gray-500 mt-0.5 whitespace-nowrap">{stage.label}</span>
              </div>

              {/* Arrow + conversion rate */}
              {nextStage && (
                <div className="flex items-center gap-0.5">
                  <div className="flex flex-col items-center">
                    {convRate !== null && (
                      <span className="text-[9px] font-medium text-gray-400 mb-0.5">{convRate}%</span>
                    )}
                    <div className="flex items-center">
                      <div className="h-px w-8 bg-gray-300" />
                      <svg width="8" height="10" viewBox="0 0 8 10" className="text-gray-300 -ml-px">
                        <path d="M0 0 L8 5 L0 10 Z" fill="currentColor" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
