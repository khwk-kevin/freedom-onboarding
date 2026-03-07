'use client';
import { useState } from 'react';
import { Clock, Zap, MoreHorizontal, Mail, Phone, Calendar, AtSign } from 'lucide-react';
import { DealPanel, DealPanelMerchant } from './DealPanel';

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
  lifetime_revenue?: number | null;
  monthly_revenue?: number | null;
  phone?: string | null;
  line_id?: string | null;
  location?: string | null;
  notes?: unknown;
  tags?: string[] | null;
}

interface Column {
  id: string;
  label: string;
  color: string;
}

const COLUMNS: Column[] = [
  { id: 'lead', label: 'Prospecting / Lead', color: '#4A90D9' },
  { id: 'onboarding', label: 'Onboarding', color: '#F5A623' },
  { id: 'onboarded', label: 'Onboarded', color: '#7B68EE' },
  { id: 'active', label: 'Closed Won', color: '#4CAF50' },
  { id: 'dormant', label: 'Dormant', color: '#9E9E9E' },
  { id: 'churned', label: 'Churned', color: '#E57373' },
  { id: 'lost', label: 'Lost', color: '#BDBDBD' },
];

function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '';
  if (amount >= 1000000) return `฿${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `฿${(amount / 1000).toFixed(0)}K`;
  return `฿${amount}`;
}

interface DealCardProps {
  merchant: KanbanMerchant;
  stageColor: string;
  onClick: () => void;
}

function DealCard({ merchant, stageColor, onClick }: DealCardProps) {
  const daysAgo = Math.floor(
    (Date.now() - new Date(merchant.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isRotting = daysAgo > 14;
  const isAging = daysAgo > 7 && !isRotting;
  const dotColor = isRotting ? '#E57373' : isAging ? '#F5A623' : '#4CAF50';
  const initial = (merchant.business_name || merchant.email)[0]?.toUpperCase() || '?';

  return (
    <div
      onClick={onClick}
      className="bg-white border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group relative overflow-hidden"
      style={{ borderLeft: `3px solid ${stageColor}` }}
    >
      <div className="p-3">
        {/* Top row — name + menu */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs font-semibold text-gray-500">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                {merchant.business_name || 'Unnamed'}
              </p>
              <p className="text-[11px] text-gray-400 truncate">{merchant.email.split('@')[0]}</p>
            </div>
          </div>
          <button
            onClick={(e) => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 transition-opacity p-0.5 shrink-0"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>

        {/* Revenue if any */}
        {merchant.lifetime_revenue && merchant.lifetime_revenue > 0 && (
          <div className="text-[13px] font-bold text-gray-800 mb-1.5">
            {formatCurrency(merchant.lifetime_revenue)}
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1 mb-2">
          {merchant.utm_source && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600">
              <Zap size={8} />
              {merchant.utm_source}
            </span>
          )}
          {merchant.business_type && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500 capitalize">
              {merchant.business_type}
            </span>
          )}
          {merchant.location && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
              {merchant.location}
            </span>
          )}
        </div>

        {/* Hover quick-actions */}
        <div className="flex items-center gap-1 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <a
            href={`mailto:${merchant.email}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Send email"
          >
            <Mail size={10} /> Email
          </a>
          {merchant.phone && (
            <a
              href={`tel:${merchant.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-500 hover:text-green-600 hover:bg-green-50 transition-colors"
              title="Call"
            >
              <Phone size={10} /> Call
            </a>
          )}
          {merchant.line_id && (
            <a
              href={`https://line.me/R/ti/p/${merchant.line_id}`}
              target="_blank"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition-colors"
              title="LINE"
            >
              <AtSign size={10} /> LINE
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {merchant.assigned_to && (
              <div
                className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center text-[9px] font-bold text-purple-600"
                title={merchant.assigned_to}
              >
                {merchant.assigned_to[0]?.toUpperCase()}
              </div>
            )}
            <span className="text-[11px] text-gray-400 flex items-center gap-1">
              <Clock size={10} />
              {daysAgo === 0 ? 'Today' : `${daysAgo}d`}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {merchant.health_score !== null && merchant.health_score !== undefined && (
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
            {/* Rotting indicator */}
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: dotColor }}
              title={isRotting ? 'Rotting deal' : isAging ? 'Aging deal' : 'Fresh deal'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  merchants: KanbanMerchant[];
  onStatusChange?: (merchantId: string, newStatus: string) => Promise<void>;
  onMerchantUpdate?: (updated: KanbanMerchant) => void;
}

export function KanbanBoard({ merchants, onStatusChange, onMerchantUpdate }: KanbanBoardProps) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<KanbanMerchant | null>(null);

  const byStatus = COLUMNS.reduce<Record<string, KanbanMerchant[]>>((acc, col) => {
    acc[col.id] = merchants.filter((m) => m.status === col.id);
    return acc;
  }, {});

  const columnTotals = COLUMNS.reduce<Record<string, number>>((acc, col) => {
    acc[col.id] = (byStatus[col.id] || []).reduce((sum, m) => sum + (m.lifetime_revenue || 0), 0);
    return acc;
  }, {});

  const handleDrop = async (colId: string) => {
    if (dragging && onStatusChange) {
      const merchant = merchants.find((m) => m.id === dragging);
      if (merchant && merchant.status !== colId) {
        await onStatusChange(dragging, colId);
      }
    }
    setDragging(null);
    setDragOver(null);
  };

  const handlePanelStatusChange = async (merchantId: string, newStatus: string) => {
    if (onStatusChange) await onStatusChange(merchantId, newStatus);
    // Update selected merchant in panel
    if (selectedMerchant?.id === merchantId) {
      setSelectedMerchant((prev) => prev ? { ...prev, status: newStatus } : prev);
    }
  };

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4 px-1">
        {COLUMNS.map((col) => {
          const count = byStatus[col.id]?.length ?? 0;
          const total = columnTotals[col.id] || 0;

          return (
            <div
              key={col.id}
              className={`flex-shrink-0 w-[255px] rounded-lg bg-gray-50 border border-gray-200 ${
                dragOver === col.id ? 'ring-2 ring-blue-400 ring-offset-1' : ''
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(col.id); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => handleDrop(col.id)}
            >
              {/* Column header */}
              <div>
                <div className="h-1 rounded-t-lg" style={{ backgroundColor: col.color }} />
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <h3 className="text-[12px] font-semibold text-gray-700 truncate">{col.label}</h3>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className="text-[11px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: col.color }}
                    >
                      {count}
                    </span>
                    {total > 0 && (
                      <span className="text-[11px] font-semibold text-gray-500">
                        {formatCurrency(total)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cards */}
              <div className="px-2 pb-2 space-y-2 min-h-[80px] max-h-[calc(100vh-230px)] overflow-y-auto">
                {(byStatus[col.id] || []).slice(0, 20).map((merchant) => (
                  <div
                    key={merchant.id}
                    draggable
                    onDragStart={() => setDragging(merchant.id)}
                    onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    className={`transition-opacity ${dragging === merchant.id ? 'opacity-30' : ''}`}
                  >
                    <DealCard
                      merchant={merchant}
                      stageColor={col.color}
                      onClick={() => setSelectedMerchant(merchant)}
                    />
                  </div>
                ))}
                {count > 20 && (
                  <div className="text-center py-2 text-[11px] text-gray-400">
                    +{count - 20} more
                  </div>
                )}
                {count === 0 && (
                  <div className="text-center py-8 text-xs text-gray-400">
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Deal slide-out panel */}
      {selectedMerchant && (
        <DealPanel
          merchant={selectedMerchant as DealPanelMerchant}
          onClose={() => setSelectedMerchant(null)}
          onStatusChange={handlePanelStatusChange}
        />
      )}
    </>
  );
}
