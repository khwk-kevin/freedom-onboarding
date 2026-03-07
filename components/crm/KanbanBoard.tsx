'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Building2, Clock, Zap, Phone, Mail, MoreHorizontal, ChevronRight } from 'lucide-react';

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
  assigned_to?: string | null;
  lifetime_revenue?: number;
  location?: string | null;
}

interface Column {
  id: string;
  label: string;
  color: string;
  headerBg: string;
  dotColor: string;
}

// Pipedrive-style pipeline columns with colored headers
const COLUMNS: Column[] = [
  { id: 'lead', label: 'Prospecting / Lead', color: '#4A90D9', headerBg: 'bg-[#4A90D9]', dotColor: 'bg-[#4A90D9]' },
  { id: 'onboarding', label: 'Onboarding', color: '#F5A623', headerBg: 'bg-[#F5A623]', dotColor: 'bg-[#F5A623]' },
  { id: 'onboarded', label: 'Onboarded', color: '#7B68EE', headerBg: 'bg-[#7B68EE]', dotColor: 'bg-[#7B68EE]' },
  { id: 'active', label: 'Closed Won', color: '#4CAF50', headerBg: 'bg-[#4CAF50]', dotColor: 'bg-[#4CAF50]' },
  { id: 'dormant', label: 'Dormant', color: '#9E9E9E', headerBg: 'bg-[#9E9E9E]', dotColor: 'bg-[#9E9E9E]' },
  { id: 'churned', label: 'Churned', color: '#E57373', headerBg: 'bg-[#E57373]', dotColor: 'bg-[#E57373]' },
  { id: 'lost', label: 'Lost', color: '#BDBDBD', headerBg: 'bg-[#BDBDBD]', dotColor: 'bg-[#BDBDBD]' },
];

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `฿${(amount / 1000).toFixed(0)}K`;
  return `฿${amount}`;
}

interface KanbanBoardProps {
  merchants: KanbanMerchant[];
  onStatusChange?: (merchantId: string, newStatus: string) => Promise<void>;
}

// Pipedrive-style deal card
function DealCard({ merchant }: { merchant: KanbanMerchant }) {
  const daysAgo = Math.floor(
    (Date.now() - new Date(merchant.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const initial = (merchant.business_name || merchant.email)[0]?.toUpperCase() || '?';

  return (
    <Link href={`/crm/merchants/${merchant.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group">
        {/* Top row — name + menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-semibold text-gray-500">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                {merchant.business_name || 'Unnamed'}
              </p>
              <p className="text-[11px] text-gray-400 truncate">{merchant.email.split('@')[0]}</p>
            </div>
          </div>
          <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity p-0.5">
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Middle — source + type badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {merchant.utm_source && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">
              <Zap size={9} />
              {merchant.utm_source}
            </span>
          )}
          {merchant.business_type && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
              {merchant.business_type}
            </span>
          )}
          {merchant.location && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
              {merchant.location}
            </span>
          )}
        </div>

        {/* Bottom row — Pipedrive-style footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {merchant.assigned_to && (
              <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[9px] font-bold text-purple-600" title={merchant.assigned_to}>
                {merchant.assigned_to[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock size={10} />
              {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {merchant.health_score !== null && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  merchant.health_score >= 70
                    ? 'bg-green-50 text-green-600'
                    : merchant.health_score >= 40
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {merchant.health_score}
              </span>
            )}
            <ChevronRight size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
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

  // Calculate totals per column (Pipedrive shows deal value sums)
  const columnTotals = COLUMNS.reduce<Record<string, number>>((acc, col) => {
    acc[col.id] = (byStatus[col.id] || []).reduce((sum, m) => sum + (m.lifetime_revenue || 0), 0);
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
    <div className="flex gap-3 overflow-x-auto pb-4 px-1">
      {COLUMNS.map((col) => {
        const count = byStatus[col.id]?.length ?? 0;
        const total = columnTotals[col.id] || 0;

        return (
          <div
            key={col.id}
            className={`flex-shrink-0 w-[260px] rounded-lg bg-gray-50 ${
              dragOver === col.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
            onDragLeave={() => setDragOver(null)}
            onDrop={() => handleDrop(col.id)}
          >
            {/* Pipedrive-style column header with colored top bar */}
            <div className="relative">
              <div className={`h-1 rounded-t-lg ${col.headerBg}`} />
              <div className="px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-[13px] font-semibold text-gray-700 truncate">{col.label}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-medium text-gray-400">
                    {count} {count === 1 ? 'deal' : 'deals'}
                  </span>
                  {total > 0 && (
                    <span className="text-[11px] font-semibold text-gray-500">
                      {formatCurrency(total)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cards area */}
            <div className="px-2 pb-2 space-y-2 min-h-[100px] max-h-[calc(100vh-220px)] overflow-y-auto">
              {(byStatus[col.id] || []).slice(0, 20).map((merchant) => (
                <div
                  key={merchant.id}
                  draggable
                  onDragStart={() => setDragging(merchant.id)}
                  onDragEnd={() => { setDragging(null); setDragOver(null); }}
                  className={`transition-opacity ${dragging === merchant.id ? 'opacity-40' : ''}`}
                >
                  <DealCard merchant={merchant} />
                </div>
              ))}
              {count > 20 && (
                <div className="text-center py-2 text-[11px] text-gray-400">
                  +{count - 20} more deals
                </div>
              )}
              {count === 0 && (
                <div className="text-center py-8 text-xs text-gray-400">
                  No deals in this stage
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
