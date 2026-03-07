'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  X, Phone, Mail, MapPin, Tag, Clock, MessageSquare,
  PhoneCall, AtSign, Calendar, ChevronDown, Send, Hash,
  TrendingUp, DollarSign, User, Building2, ExternalLink, Check,
  Edit3, Maximize2
} from 'lucide-react';

interface PipedriveData {
  contact_person?: string;
  pipedrive_label?: string;
  pipedrive_stage?: string;
  pipedrive_owner?: string;
  lost_reason?: string | null;
  activities_done?: number;
  activities_total?: number;
}

function extractPD(notes: unknown): PipedriveData | null {
  if (!Array.isArray(notes)) return null;
  const pd = (notes as Array<Record<string, unknown>>).find((n) => n && n.type === 'pipedrive_import');
  return pd ? (pd as unknown as PipedriveData) : null;
}

const PD_LABEL_COLORS: Record<string, string> = {
  'Micro Enterprise': 'bg-blue-100 text-blue-700',
  'SME': 'bg-purple-100 text-purple-700',
  'Corporate': 'bg-amber-100 text-amber-700',
};

const ONBOARDING_STAGES = ['signup', 'context', 'branding', 'products', 'rewards', 'golive', 'completed'];

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

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string; dot: string }> = {
  lead:        { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Lead',        dot: 'bg-blue-500'   },
  onboarding:  { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Onboarding',  dot: 'bg-amber-500'  },
  onboarded:   { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Onboarded',   dot: 'bg-purple-500' },
  active:      { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Active',      dot: 'bg-green-500'  },
  dormant:     { bg: 'bg-gray-100',   text: 'text-gray-600',   label: 'Dormant',     dot: 'bg-gray-400'   },
  churned:     { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Churned',     dot: 'bg-red-500'    },
  lost:        { bg: 'bg-red-50',     text: 'text-red-600',    label: 'Lost',        dot: 'bg-red-400'    },
};

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  note:          <MessageSquare size={13} />,
  call:          <PhoneCall size={13} />,
  email:         <Mail size={13} />,
  meeting:       <Calendar size={13} />,
  line:          <AtSign size={13} />,
  status_change: <Hash size={13} />,
};

const ACTIVITY_COLORS: Record<string, string> = {
  note:          'bg-gray-100 text-gray-600',
  call:          'bg-green-100 text-green-700',
  email:         'bg-blue-100 text-blue-700',
  meeting:       'bg-purple-100 text-purple-700',
  line:          'bg-teal-100 text-teal-700',
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

// Inline editable text field
function InlineField({
  value,
  placeholder,
  onSave,
  icon,
  prefix,
  type = 'text',
  className = '',
}: {
  value: string | null | undefined;
  placeholder: string;
  onSave: (v: string) => void;
  icon?: React.ReactNode;
  prefix?: string;
  type?: string;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value || ''); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft !== (value || '')) onSave(draft);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 w-full">
        {icon && <span className="text-gray-400 shrink-0">{icon}</span>}
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') { setEditing(false); setDraft(value || ''); }
          }}
          className={`flex-1 text-[12px] border border-blue-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white ${className}`}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-2 text-[12px] text-gray-700 hover:text-blue-600 transition-colors group w-full text-left"
    >
      {icon && <span className="text-gray-400 shrink-0 group-hover:text-blue-400">{icon}</span>}
      <span className={`truncate ${!value ? 'text-gray-400 italic' : ''}`}>
        {prefix}{value || placeholder}
      </span>
      <Edit3 size={9} className="text-gray-300 group-hover:text-blue-400 ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

interface DealPanelProps {
  merchant: DealPanelMerchant | null;
  onClose: () => void;
  onStatusChange?: (merchantId: string, newStatus: string) => Promise<void>;
  onFieldChange?: (merchantId: string, field: string, value: unknown) => void;
}

export function DealPanel({ merchant, onClose, onStatusChange, onFieldChange }: DealPanelProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [actType, setActType] = useState<Activity['type']>('note');
  const [actText, setActText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(merchant?.status || '');
  const [copied, setCopied] = useState('');
  const [saving, setSaving] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Local editable field state
  const [fields, setFields] = useState({
    business_name: merchant?.business_name || '',
    phone: merchant?.phone || '',
    line_id: merchant?.line_id || '',
    location: merchant?.location || '',
    assigned_to: merchant?.assigned_to || '',
    monthly_revenue: merchant?.monthly_revenue?.toString() || '',
    business_type: merchant?.business_type || '',
  });

  useEffect(() => {
    if (!merchant) return;
    setCurrentStatus(merchant.status);
    setTags(merchant.tags || []);
    setFields({
      business_name: merchant.business_name || '',
      phone: merchant.phone || '',
      line_id: merchant.line_id || '',
      location: merchant.location || '',
      assigned_to: merchant.assigned_to || '',
      monthly_revenue: merchant.monthly_revenue?.toString() || '',
      business_type: merchant.business_type || '',
    });
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

  const status = STATUS_COLORS[currentStatus] || { bg: 'bg-gray-100', text: 'text-gray-600', label: currentStatus, dot: 'bg-gray-400' };
  const daysAge = Math.floor((Date.now() - new Date(merchant.created_at).getTime()) / 86400000);
  const displayName = fields.business_name || merchant.email;
  const initial = displayName[0]?.toUpperCase() || '?';

  const patchField = async (field: string, value: unknown) => {
    setSaving(true);
    try {
      await fetch(`/api/merchants?id=${merchant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      onFieldChange?.(merchant.id, field, value);
    } finally {
      setSaving(false);
    }
  };

  const saveField = (field: keyof typeof fields) => async (v: string) => {
    const parsed: unknown = (field === 'monthly_revenue') ? (v ? parseFloat(v) : null) : (v || null);
    setFields((prev) => ({ ...prev, [field]: v }));
    await patchField(field, parsed);
  };

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
    await patchField('status', newStatus);
    if (onStatusChange) await onStatusChange(merchant.id, newStatus);
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
        className="fixed top-0 right-0 h-full w-full max-w-[700px] bg-[#f5f6f8] z-50 shadow-2xl flex flex-col overflow-hidden"
        style={{ animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              {/* Business name — inline editable */}
              <div className="flex items-center gap-1 group">
                <InlineField
                  value={fields.business_name}
                  placeholder="Business name"
                  onSave={saveField('business_name')}
                  className="text-[15px] font-bold text-gray-900"
                />
              </div>
              <div className="text-[11px] text-gray-400 truncate mt-0.5">{merchant.email}</div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {/* Status badge — clickable dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setChangingStatus((v) => !v)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.text} hover:opacity-80 transition-opacity`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${status.dot} inline-block`} />
                    {status.label}
                    <ChevronDown size={10} />
                  </button>
                  {changingStatus && (
                    <div className="absolute top-7 left-0 bg-white border border-gray-200 rounded-xl shadow-xl z-10 py-1.5 min-w-[150px] overflow-hidden">
                      {Object.entries(STATUS_COLORS).map(([k, v]) => (
                        <button
                          key={k}
                          onClick={() => handleStatusChange(k)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                          {v.label}
                          {k === currentStatus && <Check size={10} className="ml-auto text-blue-500" />}
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
                {saving && <span className="text-[10px] text-blue-400 animate-pulse">Saving…</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Link
              href={`/crm/merchants/${merchant.id}`}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Open full profile"
            >
              <Maximize2 size={15} />
            </Link>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body: 2 columns */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Activity feed */}
          <div className="flex-1 flex flex-col overflow-hidden border-r border-gray-200 min-w-0">
            {/* Activity Input */}
            <div className="bg-white p-4 border-b border-gray-200 shrink-0">
              <div className="flex gap-1.5 mb-2 flex-wrap">
                {(['note', 'call', 'email', 'meeting', 'line'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActType(t)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      actType === t
                        ? ACTIVITY_COLORS[t] + ' ring-1 ring-inset ring-current/30'
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
                placeholder={`Log ${actType}… (⌘+Enter to save)`}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400/50 min-h-[64px] bg-gray-50 placeholder-gray-400"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={submitActivity}
                  disabled={submitting || !actText.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4A90D9] hover:bg-[#3a7bc8] text-white text-xs font-medium rounded-lg disabled:opacity-40 transition-colors shadow-sm"
                >
                  <Send size={12} />
                  {submitting ? 'Saving…' : 'Log activity'}
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activities.length === 0 && (
                <div className="text-center py-12 text-sm text-gray-400">
                  <MessageSquare size={28} className="mx-auto mb-2 opacity-20" />
                  <p className="text-[13px] font-medium">No activities yet</p>
                  <p className="text-[11px] mt-1">Log a call, note, or email above</p>
                </div>
              )}
              {activities.map((act) => (
                <div key={act.id} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${ACTIVITY_COLORS[act.type]}`}>
                    {ACTIVITY_ICONS[act.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white rounded-lg border border-gray-200 px-3 py-2 shadow-sm">
                      <p className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{act.content}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[11px] text-gray-500 font-medium">{act.author}</span>
                      <span className="text-[11px] text-gray-300">·</span>
                      <span className="text-[11px] text-gray-400">{timeAgo(act.timestamp)}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ACTIVITY_COLORS[act.type]} font-medium capitalize`}>
                        {act.type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Details sidebar */}
          <div className="w-[230px] shrink-0 overflow-y-auto bg-[#f5f6f8] p-3 space-y-3">

            {/* Pipedrive + Onboarding */}
            {(() => {
              const pd = extractPD(merchant.notes);
              const stageIdx = ONBOARDING_STAGES.indexOf(merchant.onboarding_status);
              const progressPct = stageIdx >= 0 ? Math.round((stageIdx / (ONBOARDING_STAGES.length - 1)) * 100) : 0;
              return (
                <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
                  <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Pipeline</h4>
                  {pd?.contact_person && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <User size={11} className="text-gray-400 shrink-0" />
                      <span className="text-[12px] text-gray-700 truncate">{pd.contact_person}</span>
                    </div>
                  )}
                  {pd?.pipedrive_label && (
                    <div className="mb-2">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${PD_LABEL_COLORS[pd.pipedrive_label] ?? 'bg-gray-100 text-gray-600'}`}>
                        {pd.pipedrive_label}
                      </span>
                    </div>
                  )}
                  {pd?.pipedrive_owner && (
                    <div className="text-[11px] text-gray-400 mb-2">Owner: <span className="text-gray-600">{pd.pipedrive_owner}</span></div>
                  )}
                  {/* Onboarding progress bar */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">Onboarding</span>
                      <span className="text-[10px] font-semibold text-gray-600">{merchant.onboarding_status}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progressPct}%`, backgroundColor: progressPct >= 100 ? '#4CAF50' : '#4A90D9' }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1 text-right">{progressPct}% complete</div>
                  </div>
                </div>
              );
            })()}

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Quick Actions</h4>
              <div className="flex flex-col gap-0.5">
                <a href={`mailto:${merchant.email}`} className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg transition-colors">
                  <Mail size={12} className="shrink-0" /> Send Email
                </a>
                {fields.phone && (
                  <a href={`tel:${fields.phone}`} className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-green-600 hover:bg-green-50 px-2 py-1.5 rounded-lg transition-colors">
                    <Phone size={12} className="shrink-0" /> Call
                  </a>
                )}
                {fields.line_id && (
                  <a href={`https://line.me/R/ti/p/${fields.line_id}`} target="_blank" className="flex items-center gap-2 text-[12px] text-gray-600 hover:text-teal-600 hover:bg-teal-50 px-2 py-1.5 rounded-lg transition-colors">
                    <AtSign size={12} className="shrink-0" /> LINE Message
                  </a>
                )}
              </div>
            </div>

            {/* Contact — all inline editable */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Contact</h4>
              <div className="space-y-2">
                {/* Email (non-editable, just copy) */}
                <button
                  onClick={() => copyText(merchant.email, 'email')}
                  className="flex items-center gap-2 text-[12px] text-gray-700 hover:text-blue-600 transition-colors w-full text-left group"
                >
                  <Mail size={12} className="text-gray-400 shrink-0 group-hover:text-blue-400" />
                  <span className="truncate">{merchant.email}</span>
                  {copied === 'email' ? <Check size={10} className="text-green-500 shrink-0 ml-auto" /> : null}
                </button>

                <InlineField
                  value={fields.phone}
                  placeholder="Add phone…"
                  onSave={saveField('phone')}
                  icon={<Phone size={12} />}
                  type="tel"
                />
                <InlineField
                  value={fields.line_id}
                  placeholder="Add LINE ID…"
                  onSave={saveField('line_id')}
                  icon={<AtSign size={12} />}
                />
                <InlineField
                  value={fields.location}
                  placeholder="Add location…"
                  onSave={saveField('location')}
                  icon={<MapPin size={12} />}
                />
              </div>
            </div>

            {/* Deal Info — editable fields */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Deal Info</h4>
              <div className="space-y-2">
                {merchant.utm_source && (
                  <div className="flex items-center gap-2 text-[12px] text-gray-500">
                    <TrendingUp size={12} className="text-gray-400 shrink-0" />
                    <span>{merchant.utm_source}</span>
                  </div>
                )}
                <InlineField
                  value={fields.business_type}
                  placeholder="Business type…"
                  onSave={saveField('business_type')}
                  icon={<Building2 size={12} />}
                />
                <InlineField
                  value={fields.assigned_to}
                  placeholder="Assign to…"
                  onSave={saveField('assigned_to')}
                  icon={<User size={12} />}
                />
                <div className="flex items-center gap-2 text-[12px] text-gray-500">
                  <Clock size={12} className="text-gray-400 shrink-0" />
                  <span>{new Date(merchant.created_at).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
            </div>

            {/* Revenue */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Revenue</h4>
              <div className="space-y-2">
                {merchant.lifetime_revenue != null && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-gray-500">Lifetime</span>
                    <span className="text-[12px] font-semibold text-gray-800">{formatCurrency(merchant.lifetime_revenue)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <DollarSign size={12} className="text-gray-400 shrink-0" />
                  <InlineField
                    value={fields.monthly_revenue}
                    placeholder="Monthly revenue…"
                    onSave={saveField('monthly_revenue')}
                    type="number"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                <Tag size={10} /> Tags
              </h4>
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[11px] border border-blue-100">
                    {t}
                    <button onClick={() => removeTag(t)} className="hover:text-red-500 transition-colors ml-0.5">
                      <X size={8} />
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
                  placeholder="Add tag…"
                  className="flex-1 text-[11px] border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
                />
                <button onClick={addTag} className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-[12px] text-gray-600 transition-colors">+</button>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0%); opacity: 1; }
        }
      `}</style>
    </>
  );
}
