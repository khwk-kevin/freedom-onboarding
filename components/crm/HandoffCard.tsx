'use client';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Clock, User, CheckCircle2, ArrowRight } from 'lucide-react';

export interface Handoff {
  id: string;
  merchant_id: string;
  reason: string;
  reason_category: string;
  status: string;
  priority: string;
  stuck_at_phase: string | null;
  assigned_to: string | null;
  created_at: string;
  resolved_at: string | null;
  merchant_email?: string;
  merchant_business_name?: string | null;
}

const PRIORITY_STYLES: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  normal: 'bg-blue-100 text-blue-700 border-blue-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-red-50 text-red-600',
  assigned: 'bg-amber-50 text-amber-600',
  in_progress: 'bg-blue-50 text-blue-700',
  resolved: 'bg-green-50 text-green-700',
  closed: 'bg-gray-50 text-gray-500',
};

const CATEGORY_ICONS: Record<string, string> = {
  technical: '🔧',
  pricing: '💰',
  custom: '✨',
  frustrated: '😤',
  timeout: '⏱️',
  explicit: '🙋',
  other: '❓',
};

interface HandoffCardProps {
  handoff: Handoff;
  onAssign?: (id: string) => void;
  onResolve?: (id: string) => void;
}

export function HandoffCard({ handoff, onAssign, onResolve }: HandoffCardProps) {
  const merchantName = handoff.merchant_business_name || handoff.merchant_email || 'Unknown merchant';
  const isResolved = ['resolved', 'closed'].includes(handoff.status);

  return (
    <div
      className={`bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow ${
        handoff.priority === 'urgent'
          ? 'border-red-300'
          : handoff.priority === 'high'
          ? 'border-orange-200'
          : 'border-gray-200'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl" role="img" aria-label={handoff.reason_category}>
            {CATEGORY_ICONS[handoff.reason_category] || '❓'}
          </span>
          <div className="min-w-0">
            <Link
              href={`/crm/merchants/${handoff.merchant_id}`}
              className="text-sm font-semibold text-gray-900 hover:text-brand-green-dark truncate block"
            >
              {merchantName}
            </Link>
            {handoff.stuck_at_phase && (
              <p className="text-xs text-gray-400">Stuck at: {handoff.stuck_at_phase}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              PRIORITY_STYLES[handoff.priority] || PRIORITY_STYLES.normal
            }`}
          >
            {handoff.priority}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              STATUS_STYLES[handoff.status] || STATUS_STYLES.open
            }`}
          >
            {handoff.status}
          </span>
        </div>
      </div>

      {/* Reason */}
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{handoff.reason}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {formatDistanceToNow(new Date(handoff.created_at), { addSuffix: true })}
          </span>
          {handoff.assigned_to && (
            <span className="flex items-center gap-1">
              <User size={12} />
              {handoff.assigned_to}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isResolved && onResolve && (
            <button
              onClick={() => onResolve(handoff.id)}
              className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
            >
              <CheckCircle2 size={13} />
              Resolve
            </button>
          )}
          <Link
            href={`/crm/merchants/${handoff.merchant_id}`}
            className="flex items-center gap-1 text-xs text-brand-green-dark hover:underline font-medium"
          >
            View <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
