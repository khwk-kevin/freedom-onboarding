'use client';
import { useEffect, useState } from 'react';
import { KanbanBoard, KanbanMerchant } from '@/components/crm/KanbanBoard';
import { RefreshCw, Filter, Search, SlidersHorizontal, Download } from 'lucide-react';

export default function PipelinePage() {
  const [merchants, setMerchants] = useState<KanbanMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/pipeline');
      const data = await res.json();
      setMerchants(data.merchants ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = async (merchantId: string, newStatus: string) => {
    setMerchants((prev) =>
      prev.map((m) => (m.id === merchantId ? { ...m, status: newStatus } : m))
    );
    try {
      await fetch(`/api/merchants?id=${merchantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      load();
    }
  };

  // Filter merchants
  const filtered = merchants.filter((m) => {
    const matchSearch = !search || 
      (m.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchSource = filterSource === 'all' || m.utm_source === filterSource;
    return matchSearch && matchSource;
  });

  // Get unique sources for filter
  const sources = [...new Set(merchants.map((m) => m.utm_source).filter(Boolean))] as string[];

  // Summary stats — Pipedrive style
  const totalDeals = filtered.length;
  const totalValue = filtered.reduce((s, m) => s + (m.lifetime_revenue || 0), 0);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Pipedrive-style top toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left — Title + stats */}
          <div className="flex items-center gap-4">
            <h1 className="text-[15px] font-bold text-gray-900">Acquisition Pipeline</h1>
            <div className="h-5 w-px bg-gray-200" />
            <span className="text-[12px] text-gray-500">
              <span className="font-semibold text-gray-700">{totalDeals}</span> deals
              {totalValue > 0 && (
                <> · <span className="font-semibold text-gray-700">฿{(totalValue / 1000).toFixed(0)}K</span> total</>
              )}
            </span>
          </div>

          {/* Right — Controls */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>

            {/* Source filter */}
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[12px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="all">All sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={load}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-[12px] font-medium rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Kanban area */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex gap-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[260px]">
                <div className="h-1 bg-gray-200 rounded-t-lg" />
                <div className="bg-gray-100 rounded-b-lg p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-24 bg-white rounded-lg animate-pulse border border-gray-200" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <KanbanBoard merchants={filtered} onStatusChange={handleStatusChange} />
        )}
      </div>
    </div>
  );
}
