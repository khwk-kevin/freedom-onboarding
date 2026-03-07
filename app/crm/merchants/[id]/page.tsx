'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import React from 'react';
import {
  ArrowLeft, Building2, Globe, Mail, Phone, Tag, Clock, Edit3,
  CheckCircle, AlertCircle, DollarSign, User, Briefcase, Activity,
  XCircle, Copy, Search, MapPin, ChevronRight, MoreHorizontal,
  MessageSquare, FileText, ArrowRightLeft, Plus, X, TrendingUp,
  Package, Zap, RefreshCw,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PipedriveImport {
  type: string;
  source?: string;
  contact_person?: string;
  pipedrive_label?: string;
  pipedrive_stage?: string;
  pipedrive_owner?: string;
  pipedrive_status?: string;
  pipedrive_creator?: string;
  pipedrive_deal_id?: string | number;
  pipedrive_org_id?: string | number;
  activities_done?: number;
  activities_total?: number;
  last_activity_date?: string | null;
  lost_reason?: string | null;
  archived?: boolean;
}

interface EnrichmentData {
  type: string;
  enriched_at: string;
  source: string;
  query?: string;
  website: string | null;
  social: { facebook: string | null; instagram: string | null; line_oa: string | null; twitter: string | null; tiktok?: string | null; youtube?: string | null };
  google_maps: string | null;
  industry: string | null;
  description: string | null;
  employee_estimate: string | null;
  location_details: string | null;
  key_products: string[];
  competitive_landscape: string | null;
  pain_points: string[];
  monetization_opportunities: string[];
  bd_talking_points: string[];
  recent_news: string[];
  raw_findings?: string[];
}

interface NoteEntry {
  type?: string;
  date?: string;
  author?: string;
  text?: string;
  [key: string]: unknown;
}

interface Merchant {
  id: string;
  email: string;
  business_name: string | null;
  business_type: string | null;
  business_description: string | null;
  status: string;
  onboarding_status: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  health_score: number | null;
  assigned_to: string | null;
  tags: string[];
  notes: NoteEntry[];
  logo_url: string | null;
  primary_color: string | null;
  created_at: string;
  last_activity_at: string | null;
  lifetime_revenue: number;
  monthly_revenue: number;
  location: string | null;
  phone: string | null;
  line_id: string | null;
  website_url: string | null;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}

interface ConversationMessage {
  id: string;
  role: string;
  content: string;
  phase: string | null;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  is_active: boolean;
}

interface Handoff {
  id: string;
  reason: string;
  reason_category: string;
  status: string;
  priority: string;
  stuck_at_phase: string | null;
  created_at: string;
  resolved_at: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractPipedriveData(notes: NoteEntry[]): PipedriveImport | null {
  if (!Array.isArray(notes)) return null;
  return (notes.find((n) => n.type === 'pipedrive_import') as PipedriveImport) ?? null;
}

function extractEnrichmentData(notes: NoteEntry[]): EnrichmentData | null {
  if (!Array.isArray(notes)) return null;
  return (notes.find((n) => n.type === 'enrichment') as unknown as EnrichmentData) ?? null;
}

function avatarColor(name: string): string {
  const colors = ['#4A90D9','#7C3AED','#DB2777','#059669','#D97706','#DC2626','#2563EB','#0891B2'];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return colors[Math.abs(h) % colors.length];
}

function relativeTime(date: string | null): string {
  if (!date) return 'Never';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    lead: 'bg-blue-100 text-blue-700',
    onboarding: 'bg-amber-100 text-amber-700',
    onboarded: 'bg-purple-100 text-purple-700',
    active: 'bg-green-100 text-green-700',
    churned: 'bg-red-100 text-red-700',
    lost: 'bg-red-50 text-red-600',
    dormant: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function LabelBadge({ label }: { label: string }) {
  const map: Record<string, string> = {
    Corporate: 'bg-blue-100 text-blue-700',
    SME: 'bg-green-100 text-green-700',
    'Micro Enterprise': 'bg-amber-100 text-amber-700',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${map[label] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { copyToClipboard(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors"
      title="Copy"
    >
      <Copy size={11} className={copied ? 'text-green-500' : ''} />
    </button>
  );
}

const PIPELINE_STAGES = ['Prospecting', 'Connected', 'Discovery', 'Negotiation', 'Won'];

function PipelineIndicator({ stage }: { stage: string }) {
  const idx = PIPELINE_STAGES.findIndex((s) => s.toLowerCase() === stage.toLowerCase());
  return (
    <div className="flex items-center gap-1 mt-1">
      {PIPELINE_STAGES.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${i <= idx ? 'bg-[#4A90D9]' : 'bg-gray-200'}`} />
          {i < PIPELINE_STAGES.length - 1 && (
            <div className={`w-3 h-0.5 ${i < idx ? 'bg-[#4A90D9]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
      <span className="text-[10px] text-gray-400 ml-1">{stage}</span>
    </div>
  );
}

const ONBOARDING_PHASES = [
  { id: 'signup', label: 'Signup' },
  { id: 'context', label: 'Business Context' },
  { id: 'branding', label: 'Branding' },
  { id: 'products', label: 'Products' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'golive', label: 'Go Live' },
  { id: 'completed', label: 'Completed' },
];

function OnboardingJourney({ status }: { status: string }) {
  const currentIdx = ONBOARDING_PHASES.findIndex((p) => p.id === status);
  const activeIdx = currentIdx === -1 ? 0 : currentIdx;
  const doneCount = status === 'completed' ? ONBOARDING_PHASES.length : activeIdx;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-gray-900">Onboarding Journey</h3>
        <span className="text-[11px] text-gray-400">{doneCount} of {ONBOARDING_PHASES.length} complete</span>
      </div>
      <div className="flex items-center">
        {ONBOARDING_PHASES.map((phase, i) => {
          const isDone = status === 'completed' || i < activeIdx;
          const isCurrent = i === activeIdx && status !== 'completed';
          const isFuture = i > activeIdx;
          return (
            <div key={phase.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                  isDone ? 'bg-[#4CAF50] border-[#4CAF50]' :
                  isCurrent ? 'bg-white border-[#F5A623] animate-pulse' :
                  'bg-white border-gray-200'
                }`}>
                  {isDone && <CheckCircle size={14} className="text-white" strokeWidth={2.5} />}
                  {isCurrent && <div className="w-2.5 h-2.5 rounded-full bg-[#F5A623]" />}
                  {isFuture && <div className="w-2 h-2 rounded-full bg-gray-200" />}
                </div>
                <span className={`text-[10px] mt-1 text-center whitespace-nowrap ${
                  isDone ? 'text-[#4CAF50] font-medium' :
                  isCurrent ? 'text-[#F5A623] font-semibold' :
                  'text-gray-300'
                }`}>{phase.label}</span>
              </div>
              {i < ONBOARDING_PHASES.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mb-4 ${isDone ? 'bg-[#4CAF50]' : 'bg-gray-100'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HealthGauge({ score }: { score: number | null }) {
  const s = score ?? 0;
  const color = s >= 70 ? '#4CAF50' : s >= 40 ? '#F5A623' : '#E57373';
  const pct = Math.min(100, Math.max(0, s));
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[13px] font-bold" style={{ color }}>{s}</span>
    </div>
  );
}

interface InlineEditProps {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}

function InlineEdit({ value, onSave, className = '', placeholder = '—', multiline = false }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    const shared = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) commit();
        if (e.key === 'Escape') cancel();
      },
      className: `border border-blue-400 rounded px-1.5 py-0.5 text-[13px] outline-none w-full ${className}`,
    };
    return multiline ? <textarea {...shared} rows={3} /> : <input {...shared} />;
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`group flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1 transition-colors ${className}`}
    >
      <span className={value ? '' : 'text-gray-300'}>{value || placeholder}</span>
      <Edit3 size={11} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MerchantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'conversation' | 'notes' | 'handoffs'>('timeline');
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [researching, setResearching] = useState(false);
  const [phData, setPhData] = useState<{
    noData: boolean;
    noDataReason?: string;
    stats: { totalPageViews: number; totalSessions: number; totalEvents: number; firstSeen: string | null; lastSeen: string | null; sessionRecordingCount: number };
    timeline: Array<{ uuid: string; event: string; timestamp: string; url: string | null; sessionId: string | null }>;
    sessionRecordings: Array<{ id: string; startTime: string; durationSec: number; viewed: boolean; url: string }>;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/merchants?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        setMerchant(data.merchant);
        setEvents(data.events ?? []);
        setConversations(data.conversations ?? []);
        setProducts(data.products ?? []);
        setHandoffs(data.handoffs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/merchants/posthog?merchantId=${id}`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setPhData(data); })
      .catch(() => {});
  }, [id]);

  const patch = async (fields: Record<string, unknown>) => {
    const res = await fetch(`/api/merchants?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (data.merchant) setMerchant(data.merchant);
    return data.merchant;
  };

  const saveNote = async () => {
    if (!newNote.trim() || !merchant) return;
    setSavingNote(true);
    const notes = [
      ...(merchant.notes || []),
      { date: new Date().toISOString(), author: 'BD Team', text: newNote.trim() },
    ];
    await patch({ notes });
    setNewNote('');
    setSavingNote(false);
  };

  const addTag = async () => {
    if (!newTag.trim() || !merchant) return;
    const tags = [...(merchant.tags ?? []), newTag.trim()];
    await patch({ tags });
    setNewTag('');
  };

  const removeTag = async (tag: string) => {
    if (!merchant) return;
    const tags = (merchant.tags ?? []).filter((t) => t !== tag);
    await patch({ tags });
  };

  const doResearch = async () => {
    if (!merchant) return;
    setResearching(true);
    await fetch('/api/merchants/enrich', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantId: merchant.id, businessName: merchant.business_name || merchant.email }),
    }).then((r) => r.json()).then((data) => {
      if (data.merchant) setMerchant(data.merchant);
    }).catch(() => {});
    setResearching(false);
  };

  if (loading) {
    return (
      <div className="p-8 min-h-screen bg-[#f5f6f8]">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="p-8 text-center min-h-screen bg-[#f5f6f8]">
        <p className="text-gray-500 mb-2">Merchant not found</p>
        <button onClick={() => router.push('/crm/merchants')} className="text-[#4A90D9] hover:underline text-sm">
          ← Back to merchants
        </button>
      </div>
    );
  }

  const pipedriveData = extractPipedriveData(merchant.notes ?? []);
  const enrichmentData = extractEnrichmentData(merchant.notes ?? []);
  const userNotes = (merchant.notes ?? []).filter((n) => !n.type && n.text);
  const avatarBg = avatarColor(merchant.business_name || merchant.email);
  const initials = (merchant.business_name || merchant.email)[0].toUpperCase();
  const daysSinceActivity = merchant.last_activity_at
    ? Math.floor((Date.now() - new Date(merchant.last_activity_at).getTime()) / 86400000)
    : null;

  return (
    <div className="min-h-screen bg-[#f5f6f8]">

      {/* ── HEADER BAR ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.push('/crm/merchants')}
            className="flex items-center gap-1 text-[13px] text-gray-400 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={15} />
            Merchants
          </button>
          <ChevronRight size={13} className="text-gray-300" />
          <span className="text-[13px] text-gray-500">{merchant.business_name || merchant.email}</span>
        </div>

        <div className="flex items-start gap-4 flex-wrap">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
            style={{ backgroundColor: avatarBg }}
          >
            {initials}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-[22px] font-bold text-gray-900 leading-tight">
                <InlineEdit
                  value={merchant.business_name || ''}
                  placeholder="Business Name"
                  onSave={(v) => patch({ business_name: v })}
                  className="text-[22px] font-bold"
                />
              </h1>
              <StatusBadge status={merchant.status} />
              {pipedriveData?.pipedrive_stage && (
                <span className="text-[11px] px-2 py-0.5 bg-[#4A90D9]/10 text-[#4A90D9] rounded font-medium">
                  {pipedriveData.pipedrive_stage}
                </span>
              )}
              {pipedriveData?.pipedrive_label && <LabelBadge label={pipedriveData.pipedrive_label} />}
            </div>

            <div className="flex items-center gap-4 flex-wrap text-[12px] text-gray-500">
              {pipedriveData?.contact_person && (
                <span className="flex items-center gap-1">
                  <User size={12} />
                  {pipedriveData.contact_person}
                </span>
              )}
              {merchant.email && (
                <span className="flex items-center gap-1">
                  <Mail size={12} />
                  {merchant.email}
                  <CopyButton value={merchant.email} />
                </span>
              )}
              {merchant.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={12} />
                  {merchant.phone}
                  <CopyButton value={merchant.phone} />
                </span>
              )}
              {merchant.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {merchant.location}
                </span>
              )}
              {merchant.assigned_to && (
                <span className="flex items-center gap-1 text-gray-400">
                  <User size={12} />
                  {merchant.assigned_to}
                </span>
              )}
            </div>
          </div>

          {/* Meta + Actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              {daysSinceActivity !== null && <span>Last active {daysSinceActivity}d ago</span>}
              <span>·</span>
              <span>Created {new Date(merchant.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={merchant.status}
                onChange={(e) => patch({ status: e.target.value })}
                className="text-[12px] border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/30"
              >
                {['lead', 'onboarding', 'onboarded', 'active', 'dormant', 'churned', 'lost'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={() => setActiveTab('notes')}
                className="text-[12px] px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <Plus size={13} />
                Add Note
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────── */}
      <div className="p-6 space-y-5 max-w-[1600px] mx-auto">

        {/* SECTION 1: Business Intelligence */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* LEFT — Company Profile */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building2 size={16} className="text-[#4A90D9]" />
              Company Profile
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-gray-400 block mb-0.5">Business Name</label>
                <InlineEdit value={merchant.business_name || ''} placeholder="—" onSave={(v) => patch({ business_name: v })} className="text-[13px] font-medium text-gray-800" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-0.5">Business Type</label>
                <InlineEdit value={merchant.business_type || ''} placeholder="—" onSave={(v) => patch({ business_type: v })} className="text-[13px] text-gray-700" />
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-0.5">Description</label>
                <InlineEdit value={merchant.business_description || ''} placeholder="—" multiline onSave={(v) => patch({ business_description: v })} className="text-[13px] text-gray-600" />
              </div>
              {pipedriveData?.contact_person && (
                <div>
                  <label className="text-[11px] text-gray-400 block mb-0.5">Contact Person</label>
                  <span className="text-[13px] text-gray-700">{pipedriveData.contact_person}</span>
                </div>
              )}
              <div>
                <label className="text-[11px] text-gray-400 block mb-0.5">Location</label>
                <InlineEdit value={merchant.location || ''} placeholder="—" onSave={(v) => patch({ location: v })} className="text-[13px] text-gray-700" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-gray-400 block mb-0.5">Phone</label>
                  <InlineEdit value={merchant.phone || ''} placeholder="—" onSave={(v) => patch({ phone: v })} className="text-[13px] text-gray-700" />
                </div>
                <div>
                  <label className="text-[11px] text-gray-400 block mb-0.5">LINE ID</label>
                  <InlineEdit value={merchant.line_id || ''} placeholder="—" onSave={(v) => patch({ line_id: v })} className="text-[13px] text-gray-700" />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-0.5">Email</label>
                <div className="flex items-center gap-1 text-[13px] text-gray-700">
                  {merchant.email}
                  <CopyButton value={merchant.email} />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-gray-400 block mb-0.5">Website</label>
                <div className="flex items-center gap-1">
                  <InlineEdit value={merchant.website_url || ''} placeholder="—" onSave={(v) => patch({ website_url: v })} className="text-[13px] text-[#4A90D9]" />
                  {merchant.website_url && (
                    <a href={merchant.website_url} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-[#4A90D9]">
                      <Globe size={12} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Deal Intelligence */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-[#4A90D9]" />
              Deal Intelligence
            </h3>

            {pipedriveData ? (
              <div className="space-y-3">
                {pipedriveData.pipedrive_label && (
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Label</label>
                    <LabelBadge label={pipedriveData.pipedrive_label} />
                  </div>
                )}
                {pipedriveData.pipedrive_stage && (
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Pipeline Stage</label>
                    <PipelineIndicator stage={pipedriveData.pipedrive_stage} />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {pipedriveData.pipedrive_owner && (
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-0.5">Pipedrive Owner</label>
                      <span className="text-[13px] text-gray-700">{pipedriveData.pipedrive_owner}</span>
                    </div>
                  )}
                  {merchant.assigned_to && (
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-0.5">Current Owner</label>
                      <InlineEdit value={merchant.assigned_to || ''} placeholder="—" onSave={(v) => patch({ assigned_to: v })} className="text-[13px] text-gray-700" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-0.5">Lifetime Revenue</label>
                    <InlineEdit
                      value={String(merchant.lifetime_revenue || 0)}
                      onSave={(v) => patch({ lifetime_revenue: Number(v) || 0 })}
                      className="text-[14px] font-bold text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-0.5">Monthly Revenue</label>
                    <InlineEdit
                      value={String(merchant.monthly_revenue || 0)}
                      onSave={(v) => patch({ monthly_revenue: Number(v) || 0 })}
                      className="text-[14px] font-bold text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-gray-400 block mb-1">Health Score</label>
                  <HealthGauge score={merchant.health_score} />
                </div>

                {pipedriveData.lost_reason && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2">
                    <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-semibold text-red-600 block">Lost Reason</span>
                      <span className="text-[13px] text-red-700">{pipedriveData.lost_reason}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-gray-50">
                  {daysSinceActivity !== null && (
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-0.5">Days Since Activity</label>
                      <span className="text-[13px] font-semibold text-gray-700">{daysSinceActivity}d</span>
                    </div>
                  )}
                  {(pipedriveData.activities_total ?? 0) > 0 && (
                    <div>
                      <label className="text-[11px] text-gray-400 block mb-0.5">Activities</label>
                      <span className="text-[13px] font-semibold text-gray-700">
                        {pipedriveData.activities_done ?? 0} / {pipedriveData.activities_total}
                      </span>
                    </div>
                  )}
                </div>

                {pipedriveData.pipedrive_deal_id && (
                  <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-50">
                    Deal #{pipedriveData.pipedrive_deal_id}
                    {pipedriveData.pipedrive_org_id && <span> · Org #{pipedriveData.pipedrive_org_id}</span>}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-[13px] text-gray-400 text-center py-8">
                No Pipedrive data linked
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: Onboarding Journey */}
        <OnboardingJourney status={merchant.onboarding_status} />

        {/* SECTION 3: Web Research & Enrichment */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-gray-900 flex items-center gap-2">
              <Search size={16} className="text-[#4A90D9]" />
              Web Research & Enrichment
            </h3>
            <button
              onClick={doResearch}
              disabled={researching}
              className="flex items-center gap-2 px-4 py-2 bg-[#4A90D9] text-white rounded-lg text-[13px] font-medium hover:bg-[#357ABD] transition-colors disabled:opacity-50"
            >
              {researching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
              {researching ? 'Researching…' : '🔍 Research this merchant'}
            </button>
          </div>

          {enrichmentData && enrichmentData.source !== 'manual' ? (
            <div className="space-y-4">
              {/* Row 1: Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-[11px] text-gray-400 font-semibold block mb-1.5 uppercase tracking-wide">Industry</label>
                  <p className="text-[14px] font-medium text-gray-800">{enrichmentData.industry || <span className="text-gray-300 italic">Unknown</span>}</p>
                  {enrichmentData.employee_estimate && (
                    <p className="text-[11px] text-gray-400 mt-1">~{enrichmentData.employee_estimate} employees</p>
                  )}
                  {enrichmentData.location_details && (
                    <p className="text-[11px] text-gray-400 mt-0.5">📍 {enrichmentData.location_details}</p>
                  )}
                </div>
                <div className="lg:col-span-2 bg-gray-50 rounded-lg p-4">
                  <label className="text-[11px] text-gray-400 font-semibold block mb-1.5 uppercase tracking-wide">Business Description</label>
                  <p className="text-[13px] text-gray-700 leading-relaxed">{enrichmentData.description || <span className="text-gray-300 italic">No description available</span>}</p>
                </div>
              </div>

              {/* Row 2: Links */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">🌐 Website</label>
                  {enrichmentData.website ? (
                    <a href={enrichmentData.website} target="_blank" rel="noreferrer" className="text-[12px] text-[#4A90D9] hover:underline truncate block">{enrichmentData.website.replace(/^https?:\/\/(www\.)?/, '')}</a>
                  ) : <p className="text-[12px] text-gray-300 italic">Not found</p>}
                </div>
                {(['facebook', 'instagram', 'line_oa', 'twitter', 'tiktok'] as const).map((platform) => {
                  const url = enrichmentData.social?.[platform];
                  if (!url) return null;
                  const icons: Record<string, string> = { facebook: '📘', instagram: '📸', line_oa: '💬', twitter: '🐦', tiktok: '🎵' };
                  return (
                    <div key={platform} className="bg-gray-50 rounded-lg p-3">
                      <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">{icons[platform]} {platform.replace('_', ' ')}</label>
                      <a href={url} target="_blank" rel="noreferrer" className="text-[12px] text-[#4A90D9] hover:underline truncate block">{url.replace(/^https?:\/\/(www\.)?/, '')}</a>
                    </div>
                  );
                })}
                {enrichmentData.google_maps && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-[11px] text-gray-400 font-semibold block mb-1 uppercase tracking-wide">📍 Google Maps</label>
                    <a href={enrichmentData.google_maps} target="_blank" rel="noreferrer" className="text-[12px] text-[#4A90D9] hover:underline">View on Maps</a>
                  </div>
                )}
              </div>

              {/* Row 3: BD Intelligence */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pain Points */}
                {enrichmentData.pain_points?.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <label className="text-[11px] text-red-400 font-semibold block mb-2 uppercase tracking-wide">🎯 Pain Points to Address</label>
                    <ul className="space-y-1.5">
                      {enrichmentData.pain_points.map((p, i) => (
                        <li key={i} className="text-[13px] text-gray-700 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5 shrink-0">•</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Monetization Opportunities */}
                {enrichmentData.monetization_opportunities?.length > 0 && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <label className="text-[11px] text-green-600 font-semibold block mb-2 uppercase tracking-wide">💰 Monetization Opportunities</label>
                    <ul className="space-y-1.5">
                      {enrichmentData.monetization_opportunities.map((m, i) => (
                        <li key={i} className="text-[13px] text-gray-700 flex items-start gap-2">
                          <span className="text-green-500 mt-0.5 shrink-0">•</span> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Row 4: Talking Points */}
              {enrichmentData.bd_talking_points?.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <label className="text-[11px] text-blue-500 font-semibold block mb-2 uppercase tracking-wide">🗣️ BD Talking Points</label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                    {enrichmentData.bd_talking_points.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 bg-white/60 rounded-lg p-2.5">
                        <span className="text-blue-400 font-bold text-[12px] shrink-0">{i + 1}.</span>
                        <p className="text-[13px] text-gray-700">{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 5: Key Products & Competition */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {enrichmentData.key_products?.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-[11px] text-gray-400 font-semibold block mb-2 uppercase tracking-wide">📦 Key Products/Services</label>
                    <div className="flex flex-wrap gap-1.5">
                      {enrichmentData.key_products.map((p, i) => (
                        <span key={i} className="text-[12px] bg-white border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {enrichmentData.competitive_landscape && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="text-[11px] text-gray-400 font-semibold block mb-2 uppercase tracking-wide">⚔️ Competitive Landscape</label>
                    <p className="text-[13px] text-gray-700 leading-relaxed">{enrichmentData.competitive_landscape}</p>
                  </div>
                )}
              </div>

              {/* Row 6: News */}
              {enrichmentData.recent_news?.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <label className="text-[11px] text-gray-400 font-semibold block mb-2 uppercase tracking-wide">📰 Recent News</label>
                  <ul className="space-y-1.5">
                    {enrichmentData.recent_news.map((item, i) => <li key={i} className="text-[13px] text-gray-700">• {item}</li>)}
                  </ul>
                </div>
              )}

              <p className="text-[10px] text-gray-300">Researched {new Date(enrichmentData.enriched_at).toLocaleString()} via {enrichmentData.source}</p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
              <Search size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-[14px] font-medium text-gray-500 mb-1">No research data yet</p>
              <p className="text-[12px] text-gray-400">Click &quot;Research this merchant&quot; to auto-generate business intelligence, pain points, and BD talking points using AI</p>
            </div>
          )}
        </div>

        {/* SECTION 4: Revenue & Products */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Revenue */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={16} className="text-[#4CAF50]" />
              Revenue & Financials
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-[11px] text-gray-500 mb-1">Lifetime Revenue</p>
                <p className="text-2xl font-bold text-gray-900">฿{(merchant.lifetime_revenue || 0).toLocaleString()}</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-[11px] text-gray-500 mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">฿{(merchant.monthly_revenue || 0).toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center text-[12px] text-gray-400 border border-dashed border-gray-200">
              📈 Revenue trend chart — Coming soon
            </div>
          </div>

          {/* Products */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package size={16} className="text-[#7C3AED]" />
              Products
              {products.length > 0 && <span className="text-[11px] text-gray-400 font-normal">({products.length})</span>}
            </h3>
            {products.length > 0 ? (
              <div className="space-y-2">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-[13px] font-medium text-gray-800">{p.name}</p>
                      {p.category && <p className="text-[11px] text-gray-400">{p.category}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {p.price && <span className="text-[13px] font-semibold text-gray-700">฿{p.price.toLocaleString()}</span>}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-300">
                <Package size={32} className="mx-auto mb-2 opacity-30" />
                <p className="text-[13px]">No products yet</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 5: Activity & Communication */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100 px-5 gap-1">
            {([
              { key: 'timeline', label: 'Activity Timeline', icon: Activity },
              { key: 'conversation', label: 'AI Conversation', icon: MessageSquare, count: conversations.length },
              { key: 'notes', label: 'Notes', icon: FileText, count: userNotes.length },
              { key: 'handoffs', label: 'Handoffs', icon: ArrowRightLeft, count: handoffs.length },
            ] as Array<{ key: 'timeline' | 'conversation' | 'notes' | 'handoffs'; label: string; icon: React.ElementType; count?: number }>).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 py-3.5 px-3 text-[13px] font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-[#4A90D9] text-[#4A90D9]'
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                <Icon size={14} />
                {label}
                {count !== undefined && count > 0 && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">{count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5">
            {/* Timeline */}
            {activeTab === 'timeline' && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {events.length > 0 ? events.map((ev) => (
                  <div key={ev.id} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#4A90D9]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Zap size={12} className="text-[#4A90D9]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] text-gray-700">{ev.event_type.replace(/_/g, ' ')}</p>
                      {ev.event_data && typeof ev.event_data === 'object' && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {Object.entries(ev.event_data).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      )}
                      <p className="text-[11px] text-gray-300 mt-0.5">{new Date(ev.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-[13px] text-gray-300 text-center py-8">No activity recorded yet</p>
                )}
              </div>
            )}

            {/* AI Conversation */}
            {activeTab === 'conversation' && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {conversations.length > 0 ? conversations.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-[13px] ${
                      msg.role === 'user'
                        ? 'bg-[#4A90D9] text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                        {msg.phase && <span className="mr-1">[{msg.phase}]</span>}
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )) : (
                  <p className="text-[13px] text-gray-300 text-center py-8">No AI conversation yet</p>
                )}
              </div>
            )}

            {/* Notes */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note…"
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/30 resize-none"
                  />
                  <button
                    onClick={saveNote}
                    disabled={!newNote.trim() || savingNote}
                    className="mt-2 px-4 py-2 bg-[#4A90D9] text-white text-[13px] font-medium rounded-lg hover:bg-[#357ABD] transition-colors disabled:opacity-50"
                  >
                    {savingNote ? 'Saving…' : 'Add Note'}
                  </button>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto">
                  {userNotes.length > 0 ? [...userNotes].reverse().map((note, i) => (
                    <div key={i} className="border-l-2 border-[#4A90D9] pl-3">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                        <span className="font-medium">{String(note.author ?? 'Team')}</span>
                        <span>{note.date ? new Date(String(note.date)).toLocaleDateString() : ''}</span>
                      </div>
                      <p className="text-[13px] text-gray-700">{String(note.text ?? '')}</p>
                    </div>
                  )) : (
                    <p className="text-[13px] text-gray-300 text-center py-4">No notes yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Handoffs */}
            {activeTab === 'handoffs' && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {handoffs.length > 0 ? handoffs.map((h) => (
                  <div key={h.id} className={`border rounded-lg p-3.5 ${h.status === 'resolved' ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[12px] font-semibold ${h.status === 'resolved' ? 'text-green-600' : 'text-red-600'}`}>
                        {h.status === 'resolved' ? '✓ Resolved' : '⚠ Open'}
                      </span>
                      <span className="text-[11px] text-gray-400">{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-[13px] text-gray-700">{h.reason}</p>
                    {h.reason_category && <p className="text-[11px] text-gray-400 mt-1">Category: {h.reason_category}</p>}
                    {h.stuck_at_phase && <p className="text-[11px] text-gray-400">Stuck at: {h.stuck_at_phase}</p>}
                    <span className={`inline-block text-[10px] mt-2 px-1.5 py-0.5 rounded ${
                      h.priority === 'high' ? 'bg-red-100 text-red-600' :
                      h.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{h.priority}</span>
                  </div>
                )) : (
                  <p className="text-[13px] text-gray-300 text-center py-8">No handoffs</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: Tags & Metadata */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Tag size={16} className="text-[#4A90D9]" />
            Tags & Metadata
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {(merchant.tags ?? []).map((tag) => (
              <span key={tag} className="flex items-center gap-1 text-[12px] bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                {tag}
                <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={11} />
                </button>
              </span>
            ))}
            <div className="flex items-center gap-1">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                placeholder="Add tag…"
                className="text-[12px] border border-dashed border-gray-200 rounded-full px-2.5 py-1 focus:outline-none focus:border-[#4A90D9] w-24"
              />
              {newTag && (
                <button onClick={addTag} className="text-[12px] text-[#4A90D9] font-medium">Add</button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-gray-50">
            <div>
              <label className="text-[11px] text-gray-400 block">Created</label>
              <p className="text-[12px] text-gray-700">{new Date(merchant.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-[11px] text-gray-400 block">Import Source</label>
              <p className="text-[12px] text-gray-700">{merchant.utm_source || 'direct'}</p>
            </div>
            {pipedriveData?.pipedrive_deal_id && (
              <div>
                <label className="text-[11px] text-gray-400 block">Pipedrive Deal ID</label>
                <p className="text-[12px] text-gray-700">#{pipedriveData.pipedrive_deal_id}</p>
              </div>
            )}
            {pipedriveData?.pipedrive_org_id && (
              <div>
                <label className="text-[11px] text-gray-400 block">Pipedrive Org ID</label>
                <p className="text-[12px] text-gray-700">#{pipedriveData.pipedrive_org_id}</p>
              </div>
            )}
            <div>
              <label className="text-[11px] text-gray-400 block">Merchant ID</label>
              <div className="flex items-center gap-1">
                <p className="text-[11px] text-gray-400 font-mono truncate">{merchant.id}</p>
                <CopyButton value={merchant.id} />
              </div>
            </div>
          </div>
        </div>

      {/* ─── PostHog Activity ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mt-4">
        <h3 className="text-[15px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Activity size={16} className="text-purple-500" />
          PostHog Activity
        </h3>
        {!phData ? (
          <p className="text-[12px] text-gray-400">Loading PostHog data…</p>
        ) : phData.noData ? (
          <p className="text-[12px] text-gray-400">{phData.noDataReason ?? 'No PostHog data available for this merchant.'}</p>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-4">
              {[
                { label: 'Page Views', value: phData.stats.totalPageViews },
                { label: 'Sessions', value: phData.stats.totalSessions },
                { label: 'Events', value: phData.stats.totalEvents },
                { label: 'Recordings', value: phData.stats.sessionRecordingCount },
                { label: 'First Seen', value: phData.stats.firstSeen ? new Date(phData.stats.firstSeen).toLocaleDateString() : '—' },
                { label: 'Last Seen', value: phData.stats.lastSeen ? new Date(phData.stats.lastSeen).toLocaleDateString() : '—' },
              ].map((s) => (
                <div key={s.label} className="bg-[#f5f6f8] rounded-lg p-2.5">
                  <p className="text-[11px] text-gray-400">{s.label}</p>
                  <p className="text-[14px] font-semibold text-gray-800">{s.value}</p>
                </div>
              ))}
            </div>
            {phData.sessionRecordings.length > 0 && (
              <div className="mb-4">
                <p className="text-[12px] font-medium text-gray-600 mb-2">Session Recordings</p>
                <div className="space-y-1">
                  {phData.sessionRecordings.slice(0, 5).map((r) => (
                    <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 text-[12px] text-purple-600 hover:text-purple-800 hover:underline">
                      <span className="text-gray-400">{new Date(r.startTime).toLocaleString()}</span>
                      <span>{Math.round(r.durationSec)}s</span>
                      {r.viewed && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">viewed</span>}
                      <span className="text-[10px] text-purple-400">▶ Watch</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
            {phData.timeline.length > 0 && (
              <div>
                <p className="text-[12px] font-medium text-gray-600 mb-2">Event Timeline</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {phData.timeline.map((e) => (
                    <div key={e.uuid} className="flex items-center gap-3 text-[11px]">
                      <span className="text-gray-400 shrink-0">{new Date(e.timestamp).toLocaleString()}</span>
                      <span className="font-mono text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded">{e.event}</span>
                      {e.url && <span className="text-gray-400 truncate max-w-xs">{e.url}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      </div>
    </div>
  );
}
