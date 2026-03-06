'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Building2, Clock, Zap } from 'lucide-react';

export interface KanbanMerchant {
  id: string;
  email: string;
  business_name: string | null;
  business_type: string | null;
  status: string;
  utm_source: string | null;
  health_score: number | null;
  created_at: string;
  onboarding_status: string;
}

interface Column {
  id: string;
  label: string;
  color: string;
  bgColor: string;
}

const COLUMNS: Column[] = [
  { id: 'lead', label: 'Lead', color: 'text-indigo-700', bgColor: 'bg-indigo-50 border-indigo-200' },
  { id: 'onboarding', label: 'Onboarding', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  { id: 'onboarded', label: 'Onboarded', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  { id: 'active', label: 'Active', color: 'text-green-700', bgColor: 'bg-green-50 border-green-200' },
  { id: 'dormant', label: 'Dormant', color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' },
];

interface KanbanBoardProps {
  merchants: KanbanMerchant[];
  onStatusChange?: (merchantId: string, newStatus: string) => Promise<void>;
}

function MerchantCard({ merchant }: { merchant: KanbanMerchant }) {
  const daysAgo = Math.floor(
    (Date.now() - new Date(merchant.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Link href={`/crm/merchants/${merchant.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-3 hover:border-brand-green hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {merchant.business_name || merchant.email}
            </p>
            {merchant.business_name && (
              <p className="text-xs text-gray-400 truncate">{merchant.email}</p>
            )}
          </div>
          {merchant.health_score !== null && (
            <div
              className={`text-xs font-bold px-1.5 py-0.5 rounded shrink-0 ${
                merchant.health_score >= 70
                  ? 'bg-green-100 text-green-700'
                  : merchant.health_score >= 40
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {merchant.health_score}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          {merchant.business_type && (
            <span className="flex items-center gap-1">
              <Building2 size={11} />
              {merchant.business_type}
            </span>
          )}
          {merchant.utm_source && (
            <span className="flex items-center gap-1">
              <Zap size={11} />
              {merchant.utm_source}
            </span>
          )}
          <span className="flex items-center gap-1 ml-auto">
            <Clock size={11} />
            {daysAgo === 0 ? 'today' : `${daysAgo}d`}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function KanbanBoard({ merchants, onStatusChange }: KanbanBoardProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const byStatus = COLUMNS.reduce<Record<string, KanbanMerchant[]>>((acc, col) => {
    acc[col.id] = merchants.filter((m) => m.status === col.id);
    return acc;
  }, {});

  const handleDrop = async (colId: string) => {
    if (dragging && dragging !== colId && onStatusChange) {
      const merchant = merchants.find((m) => m.id === dragging);
      if (merchant && merchant.status !== colId) {
        await onStatusChange(dragging, colId);
      }
    }
    setDragging(null);
    setDragOver(null);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => (
        <div
          key={col.id}
          className={`flex-shrink-0 w-64 rounded-xl border ${col.bgColor} ${
            dragOver === col.id ? 'ring-2 ring-brand-green' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(col.id);
          }}
          onDragLeave={() => setDragOver(null)}
          onDrop={() => handleDrop(col.id)}
        >
          {/* Column header */}
          <div className="p-3 border-b border-current border-opacity-10">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.color} bg-white bg-opacity-60`}>
                {byStatus[col.id]?.length ?? 0}
              </span>
            </div>
          </div>

          {/* Cards */}
          <div className="p-2 space-y-2 min-h-[120px]">
            {(byStatus[col.id] || []).map((merchant) => (
              <div
                key={merchant.id}
                draggable
                onDragStart={() => setDragging(merchant.id)}
                onDragEnd={() => {
                  setDragging(null);
                  setDragOver(null);
                }}
                className={`transition-opacity ${dragging === merchant.id ? 'opacity-50' : 'opacity-100'}`}
              >
                <MerchantCard merchant={merchant} />
              </div>
            ))}
            {(byStatus[col.id] || []).length === 0 && (
              <div className="text-center py-6 text-xs text-gray-400">No merchants</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
