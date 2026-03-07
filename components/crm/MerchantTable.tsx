'use client';
import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, Mail, Phone, Tag, Users, Download, Trash2 } from 'lucide-react';
import { DealPanel, DealPanelMerchant } from './DealPanel';

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
  assigned_to?: string | null;
  lifetime_revenue?: number | null;
  monthly_revenue?: number | null;
  phone?: string | null;
  line_id?: string | null;
  location?: string | null;
  notes?: unknown;
  tags?: string[] | null;
}

type SortField = 'created_at' | 'business_name' | 'status' | 'health_score' | 'last_activity_at' | 'lifetime_revenue';
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-700',
  onboarding: 'bg-amber-100 text-amber-700',
  onboarded: 'bg-purple-100 text-purple-700',
  active: 'bg-green-100 text-green-700',
  dormant: 'bg-gray-100 text-gray-600',
  churned: 'bg-red-100 text-red-700',
  lost: 'bg-red-50 text-red-600',
};

const PAGE_SIZES = [25, 50, 100];

function formatCurrency(val: number | null | undefined): string {
  if (!val) return '—';
  if (val >= 1000000) return `฿${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `฿${(val / 1000).toFixed(0)}K`;
  return `฿${val.toLocaleString()}`;
}

interface MerchantTableProps {
  merchants: MerchantRow[];
  initialStatus?: string;
  onStatusChange?: (merchantId: string, newStatus: string) => Promise<void>;
}

export function MerchantTable({ merchants, initialStatus, onStatusChange }: MerchantTableProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus || '');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantRow | null>(null);

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
      const va = a[sortField] ?? '';
      const vb = b[sortField] ?? '';
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [merchants, search, statusFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = paginated.length > 0 && paginated.every((m) => selected.has(m.id));

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        paginated.forEach((m) => next.delete(m.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        paginated.forEach((m) => next.add(m.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportSelected = () => {
    const rows = filtered.filter((m) => selected.has(m.id));
    const csv = [
      ['Name', 'Email', 'Status', 'Source', 'Health', 'Revenue', 'Created'].join(','),
      ...rows.map((m) => [
        m.business_name || '',
        m.email,
        m.status,
        m.utm_source || '',
        m.health_score ?? '',
        m.lifetime_revenue ?? '',
        new Date(m.created_at).toLocaleDateString(),
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'merchants.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown size={13} className="text-gray-300 inline" />;
    return sortDir === 'asc'
      ? <ChevronUp size={13} className="text-[#4A90D9] inline" />
      : <ChevronDown size={13} className="text-[#4A90D9] inline" />;
  };

  const allStatuses = Array.from(new Set(merchants.map((m) => m.status)));

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search merchants..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        >
          <option value="">All statuses</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <span className="text-sm text-gray-400 ml-auto">{filtered.length} merchants</span>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-3 bg-[#4A90D9] text-white px-4 py-2.5 rounded-lg">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={exportSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-md transition-colors"
            >
              <Download size={12} /> Export CSV
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-md transition-colors"
            >
              <Trash2 size={12} /> Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="pl-4 pr-2 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                  />
                </th>
                <th
                  className="text-left px-3 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort('business_name')}
                >
                  Name <SortIcon field="business_name" />
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Email</th>
                <th
                  className="text-left px-3 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort('status')}
                >
                  Status <SortIcon field="status" />
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Source</th>
                <th
                  className="text-left px-3 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort('health_score')}
                >
                  Health <SortIcon field="health_score" />
                </th>
                <th
                  className="text-left px-3 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort('lifetime_revenue')}
                >
                  Revenue <SortIcon field="lifetime_revenue" />
                </th>
                <th
                  className="text-left px-3 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort('created_at')}
                >
                  Joined <SortIcon field="created_at" />
                </th>
                <th
                  className="text-left px-3 py-3 font-medium text-gray-500 cursor-pointer hover:text-gray-700 select-none"
                  onClick={() => toggleSort('last_activity_at')}
                >
                  Last Active <SortIcon field="last_activity_at" />
                </th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((m) => (
                <tr
                  key={m.id}
                  onClick={() => setSelectedMerchant(m)}
                  className={`border-b border-gray-50 hover:bg-blue-50/30 transition-colors cursor-pointer group ${
                    selected.has(m.id) ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <td className="pl-4 pr-2 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[11px] font-bold text-gray-500 shrink-0">
                        {(m.business_name || m.email)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-[13px] truncate max-w-[180px]">
                          {m.business_name || '—'}
                        </p>
                        {m.business_type && (
                          <p className="text-[11px] text-gray-400 capitalize">{m.business_type}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] text-gray-600 truncate max-w-[180px]">{m.email}</span>
                      {m.phone && (
                        <a
                          href={`tel:${m.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-gray-300 hover:text-green-500 transition-colors"
                          title={m.phone}
                        >
                          <Phone size={11} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[m.status] || 'bg-gray-100 text-gray-600'}`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[12px] text-gray-500">{m.utm_source || 'direct'}</span>
                  </td>
                  <td className="px-3 py-3">
                    {m.health_score !== null && m.health_score !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              m.health_score >= 70 ? 'bg-green-500' :
                              m.health_score >= 40 ? 'bg-amber-500' :
                              'bg-red-400'
                            }`}
                            style={{ width: `${m.health_score}%` }}
                          />
                        </div>
                        <span className={`text-[11px] font-bold ${
                          m.health_score >= 70 ? 'text-green-600' :
                          m.health_score >= 40 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>
                          {m.health_score}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`text-[12px] font-medium ${m.lifetime_revenue ? 'text-gray-800' : 'text-gray-300'}`}>
                      {formatCurrency(m.lifetime_revenue)}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-[12px] text-gray-400">
                    {new Date(m.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-3 text-[12px] text-gray-400">
                    {m.last_activity_at ? new Date(m.last_activity_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-sm text-gray-400">
                    <Users size={28} className="mx-auto mb-2 opacity-20" />
                    No merchants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="text-xs border border-gray-200 rounded px-2 py-1 bg-white"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 mr-2">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2.5 py-1 text-xs border rounded transition-colors ${
                      p === page
                        ? 'bg-[#4A90D9] text-white border-[#4A90D9]'
                        : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2 py-1 text-xs border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deal Panel */}
      {selectedMerchant && (
        <DealPanel
          merchant={selectedMerchant as DealPanelMerchant}
          onClose={() => setSelectedMerchant(null)}
          onStatusChange={onStatusChange}
        />
      )}
    </div>
  );
}
