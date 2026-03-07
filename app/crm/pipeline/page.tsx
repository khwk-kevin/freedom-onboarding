'use client';
import { useEffect, useState } from 'react';
import { KanbanBoard, KanbanMerchant } from '@/components/crm/KanbanBoard';
import { ConversionBar } from '@/components/crm/ConversionBar';
import { RefreshCw, Search, ChevronDown } from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  lead: '#4A90D9',
  onboarding: '#F5A623',
  onboarded: '#7B68EE',
  active: '#4CAF50',
  dormant: '#9E9E9E',
  churned: '#E57373',
  lost: '#BDBDBD',
};

const STAGE_ORDER = ['lead', 'onboarding', 'onboarded', 'active', 'dormant', 'churned', 'lost'];
const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  onboarding: 'Onboarding',
  onboarded: 'Onboarded',
  active: 'Won',
  dormant: 'Dormant',
  churned: 'Churned',
  lost: 'Lost',
};

export default function PipelinePage() {
  const [merchants, setMerchants] = useState<KanbanMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      // Fetch full merchant data including phone, line_id, notes, tags, revenue
      const res = await fetch('/api/merchants?limit=500');
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

  const filtered = merchants.filter((m) => {
    const matchSearch = !search ||
      (m.business_name || '').toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchSource = filterSource === 'all' || m.utm_source === filterSource;
    return matchSearch && matchSource;
  });

  const sources = [...new Set(merchants.map((m) => m.utm_source).filter(Boolean))] as string[];

  const totalDeals = filtered.length;
  const totalValue = filtered.reduce((s, m) => s + (m.lifetime_revenue || 0), 0);

  // Build conversion bar stages
  const conversionStages = STAGE_ORDER.slice(0, 5).map((id) => ({
    id,
    label: STAGE_LABELS[id],
    count: filtered.filter((m) => m.status === id).length,
    color: STAGE_COLORS[id],
  }));

  return (
    <div className="h-full flex flex-col bg-[#f5f6f8]">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-5 py-2.5 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Pipeline selector */}
            <button className="flex items-center gap-1.5 text-[14px] font-bold text-gray-900 hover:text-blue-600 transition-colors">
              Acquisition Pipeline
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            <div className="h-4 w-px bg-gray-200" />
            <span className="text-[12px] text-gray-500">
              <span className="font-semibold text-gray-700">{totalDeals}</span> deals
              {totalValue > 0 && (
                <> · <span className="font-semibold text-gray-700">
                  ฿{(totalValue / 1000).toFixed(0)}K
                </span> total</>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
              />
            </div>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-[12px] text-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
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

      {/* Conversion bar */}
      <ConversionBar stages={conversionStages} />

      {/* Kanban board */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex gap-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[255px]">
                <div className="h-1 bg-gray-200 rounded-t-lg" />
                <div className="bg-gray-100 rounded-b-lg p-3 space-y-2 border border-gray-200">
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
