'use client';

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  color?: string;
}

export function StatsCard({ label, value, change, icon, color = 'blue' }: StatsCardProps) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-[11px] font-medium mt-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {change >= 0 ? '▲' : '▼'} {Math.abs(change)}% vs last week
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
