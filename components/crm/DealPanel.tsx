'use client';
import { useEffect, useState, useRef } from 'react';
import {
  X, Phone, Mail, MapPin, Tag, Clock, MessageSquare,
  PhoneCall, AtSign, Calendar, ChevronDown, Send, Hash,
  TrendingUp, DollarSign, User, Building2, ExternalLink, Check
} from 'lucide-react';

export interface DealPanelMerchant {
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

interface Activity {
  id: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'line' | 'status_change';
  content: string;
  author: string;
  timestamp: string;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  lead: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Lead' },
  onboarding: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Onboarding' },
  onboarded: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Onboarded' },
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  dormant: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Dormant' },
  churned: { bg: 'bg-red-100', text: 'text-red-700', label: 'Churned' },
  lost: { bg: 'bg-red-50', text: 'text-red-600', label: 'Lost' },
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  note: <MessageSquare size={13} />,
  call: <PhoneCall size={13} />,
  email: <Mail size={13} />,
  meeting: <Calendar size={13} />,
  line: <AtSign size={13} />,
  status_change: <Hash size={13} />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  note: 'bg-gray-100 text-gray-600',
  call: 'bg-green-100 text-green-700',
  email: 'bg-blue-100 text-blue-700',
  meeting: 'bg-purple-100 text-purple-700',
  line: 'bg-teal-100 text-teal-700',
  status_change: 'bg-amber-100 text-amber-700',
};

function formatCurrency(val: number | null | undefined): string {
  if (!val) return '฿0';
  if (val >= 1000000) return `฿${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `฿${(val / 1000).toFixed(0)}K`;
  return `฿${val.toLocaleString()}`;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface DealPanelProps {
  merchant: DealPanelMerchant | null;
  onClose: () => void;
  onStatusChange?: (merchantId: string, newStatus: string) => Promise<void>;
}

export function DealPanel({ merchant, onClose, onStatusChange }: DealPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [actType, setActType] = useState<Activity['type']>('note');
  const [actText, setActText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(merchant?.status || '');
  const [copied, setCopied] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!merchant) return;
    setCurrentStatus(merchant.status);
    setTags(merchant.tags || []);
    // Load activities from notes JSONB
    if (merchant.notes && typeof merchant.notes === 'object' && Array.isArray((merchant.notes as { activities?: unknown[] }).activities)) {
      setActivities((merchant.notes as { activities: Activity[] }).activities);
    } else {
      setActivities([]);
    }
  }, [merchant?.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!merchant) return null;

  const status = STATUS_COLORS[currentStatus] || { bg: 'bg-gray-100', text: 'text-gray-600', label: currentStatus };
  const daysAge = Math.floor((Date.now() - new Date(merchant.created_at).getTime()) / 86400000);
  const initial = (merchant.business_name || merchant.email)[0]?.toUpperCase() || '?';

  const saveNotes = async (newActivities: Activity[], newTags: string[]) => {
    const notesData = { activities: newActivities };
    await fetch(`/api/merchants?id=${merchant.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: notesData, tags: newTags }),
    });
  };

  const submitActivity = async () => {
    if (!actText.trim()) return;
    setSubmitting(true);
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: actType,
      content: actText.trim(),
      author: 'BD Team',
      timestamp: new Date().toISOString(),
    };
    const updated = [newActivity, ...activities];
    setActivities(updated);
    setActText('');
    await saveNotes(updated, tags);
    setSubmitting(false);
  };

  const addTag = async () => {
    if (!tagInput.trim() || tags.includes(tagInput.trim())) { setTagInput(''); return; }
    const newTags = [...tags, tagInput.trim()];
    setTags(newTags);
    setTagInput('');
    await saveNotes(activities, newTags);
  };

  const removeTag = async (t: string) => {
    const newTags = tags.filter((x) => x !== t);
    setTags(newTags);
    await saveNotes(activities, newTags);
  };

  const handleStatusChange = async (newStatus: string) => {
    setCurrentStatus(newStatus);
    setChangingStatus(false);
    if (onStatusChange) await onStatusChange(merchant.id, newStatus);
    // Also log a status change activity
    const act: Activity = {
      id: Date.now().toString(),
      type: 'status_change',
      content: `Status changed to ${newStatus}`,
      author: 'BD Team',
      timestamp: new Date().toISOString(),
    };
    const updated = [act, ...activities];
    setActivities(updated);
    await saveNotes(updated, tags);
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1500);
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className="fixed top-0 right-0 h-full w-full max-w-[680px] bg-[#f5f6f8] z-50 shadow-2xl flex flex-col overflow-hidden animate-slide-in-right"
        style={{ animation: 'slideInRight 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold text-gray-900 truncate">
                {merchant.business_name || merchant.email}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                {/* Status badge — clickable */}
                <div className="relative">
                  <button
                    onClick={() => setChangingStatus((v) => !v)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} hover:opacity-80 transition-opacity`}
                  >
                    {status.label}
                    <ChevronDown size={10} />
                  </button>
                  {changingStatus && (
                    <div className="absolute top-6 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
                      {Object.entries(STATUS_COLORS).map(([k, v]) => (
                        <button
                          key={k}
                          onClick={() => handleStatusChange(k)}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2"
                        >
                          <span className={`w-2 h-2 rounded-full ${v.bg}`} />
                          {v.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {merchant.health_score !== null && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                    merchant.health_score >= 70 ? 'bg-green-50 text-green-600' :
                    merchant.health_score >= 40 ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    HS {merchant.health_score}
                  </span>
                )}
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={10} /> {daysAge}d old
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/crm/merchants/${merchant.id}`}
              target="_blank"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              title="Open full page"
            >
              <ExternalLink size={15} />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body: 2 columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Activity */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
            {/* Activity Input */}
            <div className="bg-white p-4 border-b border-gray-200 shrink-0">
              <div className="flex gap-2 mb-2">
                {(['note', 'call', 'email', 'meeting', 'line'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActType(t)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                      actType === t
                        ? ACTIVITY_COLORS[t] + ' ring-1 ring-current ring-opacity-30'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {ACTIVITY_ICONS[t]}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <textarea
                value={actText}
                onChange={(e) => setActText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitActivity();
                }}
                placeholder={`Add ${actType}...`}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 min-h-[64px]"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={submitActivity}
                  disabled={submitting || !actText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A90D9] hover:bg-[#3a7bc8] text-white text-xs font-medium rounded-lg disabled:opacity-40 transition-colors"
                >
                  <Send size={12} />
                  {submitting ? 'Saving...' : 'Save activity'}
                </button>
              </div>
            </div>

            {/* Activity Timeline */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activities.length === 0 && (
                <div className="text-center py-10 text-sm text-gray-400">
                  <MessageSquare size={24} className="mx-auto mb-2 opacity-30" />
                  No activities yet. Log a call, note, or email.
                </div>
              )}
              {activities.map((act) => (
                <div key={act.id} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${ACTIVITY_COLORS[act.type]}`}>
                    {ACTIVITY_ICONS[act.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                      <p className="text-[13px] text-gray-800 leading-relaxed">{act.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-gray-400 font-medium">{act.author}</span>
                      <span className="text-[11px] text-gray-300">·</span>
                      <span className="text-[11px] text-gray-400">{timeAgo(act.timestamp)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${ACTIVITY_COLORS[act.type]} font-medium capitalize`}>
                        {act.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Details */}
          <div className="w-[220px] shrink-0 overflow-y-auto bg-[#f5f6f8] p-3 space-y-3">
            {/* Contact */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Contact</h4>
              <div className="space-y-1.5">
                <button
                  onClick={() => copyText(merchant.email, 'email')}
                  className="flex items-center gap-2 text-[12px] text-gray-700 hover:text-blue-600 transition-colors group w-full text-left"
                >
                  <Mail size={12} className="text-gray-400 shrink-0" />
                  <span className="truncate">{merchant.email}</span>
                  {copied === 'email' ? <Check size={10} className="text-green-500 shrink-0" /> : null}
                </button>
                {merchant.phone && (
                  <button
                    onClick={() => copyText(merchant.phone!, 'phone')}
                    className="flex items-center gap-2 text-[12px] text-gray-700 hover:text-blue-600 transition-colors w-full text-left"
                  >
                    <Phone size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{merchant.phone}</span>
                    {copied === 'phone' ? <Check size={10} className="text-green-500 shrink-0" /> : null}
                  </button>
                )}
                {merchant.line_id && (
                  <button
                    onClick={() => copyText(merchant.line_id!, 'line')}
                    className="flex items-center gap-2 text-[12px] text-gray-700 hover:text-blue-600 transition-colors w-full text-left"
                  >
                    <AtSign size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">LINE: {merchant.line_id}</span>
                    {copied === 'line' ? <Check size={10} className="text-green-500 shrink-0" /> : null}
                  </button>
                )}
                {merchant.location && (
                  <div className="flex items-center gap-2 text-[12px] text-gray-500">
                    <MapPin size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{merchant.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Deal Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Deal Info</h4>
              <div className="space-y-1.5">
                {merchant.utm_source && (
                  <div className="flex items-center gap-2 text-[12px] text-gray-600">
                    <TrendingUp size={12} className="text-gray-400 shrink-0" />
                    <span>Source: {merchant.utm_source}</span>
                  </div>
                )}
                {merchant.business_type && (
                  <div className="flex items-center gap-2 text-[12px] text-gray-600">
                    <Building2 size={12} className="text-gray-400 shrink-0" />
                    <span className="capitalize">{merchant.business_type}</span>
                  </div>
                )}
                {merchant.assigned_to && (
                  <div className="flex items-center gap-2 text-[12px] text-gray-600">
                    <User size={12} className="text-gray-400 shrink-0" />
                    <span>{merchant.assigned_to}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-[12px] text-gray-500">
                  <Clock size={12} className="text-gray-400 shrink-0" />
                  <span>{new Date(merchant.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Revenue */}
            {(merchant.lifetime_revenue || merchant.monthly_revenue) && (
              <div className="bg-white rounded-lg border border-gray-200 p-3">
                <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Revenue</h4>
                <div className="space-y-1.5">
                  {merchant.lifetime_revenue != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Lifetime</span>
                      <span className="text-[12px] font-semibold text-gray-800">{formatCurrency(merchant.lifetime_revenue)}</span>
                    </div>
                  )}
                  {merchant.monthly_revenue != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">Monthly</span>
                      <span className="text-[12px] font-semibold text-gray-800">{formatCurrency(merchant.monthly_revenue)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Tag size={10} /> Tags
              </h4>
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[11px]">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors">
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag()}
                  placeholder="Add tag..."
                  className="flex-1 text-[11px] border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button onClick={addTag} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-[11px] text-gray-600 transition-colors">+</button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-3">
              <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Quick Actions</h4>
              <div className="flex flex-col gap-1.5">
                <a
                  href={`mailto:${merchant.email}`}
                  className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded transition-colors"
                >
                  <Mail size={12} /> Send Email
                </a>
                {merchant.phone && (
                  <a
                    href={`tel:${merchant.phone}`}
                    className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-green-600 hover:bg-green-50 px-2 py-1.5 rounded transition-colors"
                  >
                    <Phone size={12} /> Call
                  </a>
                )}
                {merchant.line_id && (
                  <a
                    href={`https://line.me/R/ti/p/${merchant.line_id}`}
                    target="_blank"
                    className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-2 py-1.5 rounded transition-colors"
                  >
                    <AtSign size={12} /> LINE Message
                  </a>
                )}
                <a
                  href={`/crm/merchants/${merchant.id}`}
                  className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-gray-900 hover:bg-gray-50 px-2 py-1.5 rounded transition-colors"
                >
                  <ExternalLink size={12} /> Full Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
