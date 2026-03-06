'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, Search, ExternalLink } from 'lucide-react';

export interface MerchantRow {
  id: string;
  email: string;
  business_name: string | null;
  business_type: string | null;
  status: string;
  onboarding_status: string;
  utm_source: string | null;
  health_score: number | null;
  created_at: string;
  last_activity_at: string | null;
}

type SortField = 'created_at' | 'business_name' | 'status' | 'health_score' | 'last_activity_at';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<string, string> = {
  lead: 'bg-indigo-100 text-indigo-700',
  onboarding: 'bg-amber-100 text-amber-700',
  onboarded: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  dormant: 'bg-gray-100 text-gray-600',
  churned: 'bg-red-100 text-red-700',
  lost: 'bg-red-50 text-red-600',
};

interface MerchantTableProps {
  merchants: MerchantRow[];
  initialStatus?: string;
}

export function MerchantTable({ merchants, initialStatus }: MerchantTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus || '');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const filtered = useMemo(() => {
    let list = [...merchants];

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.email.toLowerCase().includes(q) ||
          (m.business_name || '').toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      list = list.filter((m) => m.status === statusFilter);
    }

    list.sort((a, b) => {
      let va: string | number | null = a[sortField];
      let vb: string | number | null = b[sortField];
      if (va === null) va = '';
      if (vb === null) vb = '';
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [merchants, search, statusFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown size={14} className="text-gray-300" />;
    return sortDir === 'asc' ? (
      <ChevronUp size={14} className="text-gray-600" />
    ) : (
      <ChevronDown size={14} className="text-gray-600" />
    );
  };

  const allStatuses = Array.from(new Set(merchants.map((m) => m.status)));

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search merchants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
        >
          <option value="">All statuses</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <span className="self-center text-sm text-gray-400">{filtered.length} merchants</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th
                  className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSort('business_name')}
                >
                  <span className="flex items-center gap-1">
                    Merchant <SortIcon field="business_name" />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSort('status')}
                >
                  <span className="flex items-center gap-1">
                    Status <SortIcon field="status" />
                  </span>
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Source</th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSort('health_score')}
                >
                  <span className="flex items-center gap-1">
                    Health <SortIcon field="health_score" />
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700"
                  onClick={() => toggleSort('created_at')}
                >
                  <span className="flex items-center gap-1">
                    Joined <SortIcon field="created_at" />
                  </span>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 truncate max-w-[200px]">
                        {m.business_name || m.email}
                      </p>
                      {m.business_name && (
                        <p className="text-xs text-gray-400 truncate max-w-[200px]">{m.email}</p>
                      )}
                      {m.business_type && (
                        <p className="text-xs text-gray-400 capitalize">{m.business_type}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[m.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{m.utm_source || 'direct'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {m.health_score !== null ? (
                      <span
                        className={`text-xs font-bold ${
                          m.health_score >= 70
                            ? 'text-green-600'
                            : m.health_score >= 40
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {m.health_score}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/crm/merchants/${m.id}`}
                      className="inline-flex items-center gap-1 text-xs text-brand-green-dark hover:underline font-medium"
                    >
                      View <ExternalLink size={11} />
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                    No merchants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
