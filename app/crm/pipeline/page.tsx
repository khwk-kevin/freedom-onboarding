'use client';
import { useEffect, useState } from 'react';
import { KanbanBoard, KanbanMerchant } from '@/components/crm/KanbanBoard';
import { RefreshCw } from 'lucide-react';

export default function PipelinePage() {
  const [merchants, setMerchants] = useState<KanbanMerchant[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (merchantId: string, newStatus: string) => {
    // Optimistic update
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
      // Revert on error
      load();
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {merchants.length} merchants · Drag cards to update status
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

      {loading ? (
        <div className="flex gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-64 h-64 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <KanbanBoard merchants={merchants} onStatusChange={handleStatusChange} />
      )}
    </div>
  );
}
