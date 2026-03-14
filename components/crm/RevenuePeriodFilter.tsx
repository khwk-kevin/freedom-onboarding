'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const OPTIONS = [
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: 'All', value: 'all' },
];

export function RevenuePeriodFilter() {
  const params = useSearchParams();
  const current = params.get('period') ?? '1m';

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {OPTIONS.map((opt) => (
        <Link
          key={opt.value}
          href={`?period=${opt.value}`}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            current === opt.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
