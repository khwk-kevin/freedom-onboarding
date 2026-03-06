'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { HandoffCard, Handoff } from '@/components/crm/HandoffCard';
import { RefreshCw, Filter } from 'lucide-react';

type StatusFilter = 'all' | 'open' | 'assigned' | 'in_progress' | 'resolved';

function HandoffsContent() {
  const searchParams = useSearchParams();
  const merchantId = searchParams.get('merchantId');

  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('open');
  const [categoryFilter, setCategoryFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (merchantId) params.set('merchantId', merchantId);
      const res = await fetch(`/api/handoffs?${params}`);
      const data = await res.json();
      setHandoffs(data.handoffs ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [merchantId]);

  const handleResolve = async (id: string) => {
    await fetch(`/api/handoffs?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved', resolved_at: new Date().toISOString() }),
    });
    setHandoffs((prev) =>
      prev.map((h) => (h.id === id ? { ...h, status: 'resolved', resolved_at: new Date().toISOString() } : h))
    );
  };

  const filtered = handoffs.filter((h) => {
    if (statusFilter !== 'all' && h.status !== statusFilter) return false;
    if (categoryFilter && h.reason_category !== categoryFilter) return false;
    return true;
  });

  const counts: Record<StatusFilter, number> = {
    all: handoffs.length,
    open: handoffs.filter((h) => h.status === 'open').length,
    assigned: handoffs.filter((h) => h.status === 'assigned').length,
    in_progress: handoffs.filter((h) => h.status === 'in_progress').length,
    resolved: handoffs.filter((h) => h.status === 'resolved').length,
  };

  const allCategories = Array.from(new Set(handoffs.map((h) => h.reason_category)));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Handoffs</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Merchant escalations requiring BD team attention
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        {(['all', 'open', 'assigned', 'in_progress', 'resolved'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === s
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'in_progress' ? 'In progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs">{counts[s]}</span>
          </button>
        ))}
      </div>

      {/* Category filter */}
      {allCategories.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <Filter size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500">Category:</span>
          <button
            onClick={() => setCategoryFilter('')}
            className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
              !categoryFilter
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === categoryFilter ? '' : cat)}
              className={`text-xs px-2 py-0.5 rounded-full capitalize transition-colors ${
                categoryFilter === cat
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium mb-1">
            {statusFilter === 'open' ? '🎉 No open handoffs!' : 'No handoffs found'}
          </p>
          <p className="text-sm">
            {statusFilter === 'open'
              ? 'All escalations have been handled.'
              : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => (
            <HandoffCard key={h.id} handoff={h} onResolve={handleResolve} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function HandoffsPage() {
  return (
    <Suspense fallback={<div className="p-8"><div className="h-64 bg-gray-100 rounded-xl animate-pulse" /></div>}>
      <HandoffsContent />
    </Suspense>
  );
}
