'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MerchantTable, MerchantRow } from '@/components/crm/MerchantTable';
import { RefreshCw } from 'lucide-react';
import { Suspense } from 'react';

function MerchantsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || '';
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/merchants?limit=500');
      const data = await res.json();
      setMerchants(data.merchants ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Merchants</h1>
          <p className="text-gray-500 mt-1 text-sm">All merchants in the pipeline</p>
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
        <div className="bg-white rounded-xl border border-gray-200 h-64 animate-pulse" />
      ) : (
        <MerchantTable
          merchants={merchants}
          initialStatus={initialStatus}
          onStatusChange={async (merchantId, newStatus) => {
            setMerchants((prev) => prev.map((m) => m.id === merchantId ? { ...m, status: newStatus } : m));
            await fetch(`/api/merchants?id=${merchantId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newStatus }),
            });
          }}
        />
      )}
    </div>
  );
}

export default function MerchantsPage() {
  return (
    <Suspense fallback={<div className="p-8"><div className="h-64 bg-gray-100 rounded-xl animate-pulse" /></div>}>
      <MerchantsContent />
    </Suspense>
  );
}
