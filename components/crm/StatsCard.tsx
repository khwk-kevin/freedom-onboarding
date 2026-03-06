import { ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  description?: string;
  iconBg?: string;
}

export function StatsCard({ label, value, change, icon, description, iconBg = 'bg-gray-50' }: StatsCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-xs mt-1 font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(change)}% vs last week
            </p>
          )}
          {description && !change && (
            <p className="text-xs text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center text-gray-500 shrink-0 ml-3`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
