'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MerchantTimeline, TimelineEvent } from '@/components/crm/MerchantTimeline';
import { ConversationView, ConversationMessage } from '@/components/crm/ConversationView';
import Link from 'next/link';
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  Phone,
  Tag,
  Clock,
  Edit3,
  CheckCircle,
  AlertCircle,
  DollarSign,
  User,
  Briefcase,
  GitBranch,
  Activity,
  XCircle,
} from 'lucide-react';

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

function extractPipedriveData(notes: unknown): PipedriveImport | null {
  if (!Array.isArray(notes)) return null;
  const found = (notes as Array<Record<string, unknown>>).find(
    (n) => n && n.type === 'pipedrive_import'
  );
  return found ? (found as unknown as PipedriveImport) : null;
}

const LABEL_COLORS: Record<string, string> = {
  'Micro Enterprise': 'bg-blue-100 text-blue-700',
  'SME': 'bg-purple-100 text-purple-700',
  'Corporate': 'bg-amber-100 text-amber-700',
};

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
  notes: Array<Record<string, unknown>>;
  logo_url: string | null;
  primary_color: string | null;
  created_at: string;
  last_activity_at: string | null;
  lifetime_revenue: number;
  monthly_revenue: number;
  location: string | null;
  phone: string | null;
  website_url: string | null;
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

const STATUS_COLORS: Record<string, string> = {
  lead: 'bg-indigo-100 text-indigo-700',
  onboarding: 'bg-amber-100 text-amber-700',
  onboarded: 'bg-blue-100 text-blue-700',
  active: 'bg-green-100 text-green-700',
  dormant: 'bg-gray-100 text-gray-600',
};

export default function MerchantDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState<'timeline' | 'conversation'>('timeline');
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/merchants?id=${id}`)
      .then((r) => r.json())
      .then((data) => {
        setMerchant(data.merchant);
        setEvents(data.events ?? []);
        setConversations(data.conversations ?? []);
        setHandoffs(data.handoffs ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const saveNote = async () => {
    if (!newNote.trim() || !merchant) return;
    setSavingNote(true);
    const notes = [
      ...(merchant.notes || []),
      { date: new Date().toISOString(), author: 'BD Team', text: newNote.trim() },
    ];
    const res = await fetch(`/api/merchants?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    const data = await res.json();
    if (data.merchant) {
      setMerchant(data.merchant);
      setNewNote('');
    }
    setSavingNote(false);
  };

  const updateStatus = async (newStatus: string) => {
    const res = await fetch(`/api/merchants?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    const data = await res.json();
    if (data.merchant) setMerchant(data.merchant);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse" />
        <div className="grid grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-xl h-96 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Merchant not found</p>
        <Link href="/crm/merchants" className="text-brand-green-dark hover:underline text-sm mt-2 inline-block">
          ← Back to merchants
        </Link>
      </div>
    );
  }

  const pipedriveData = extractPipedriveData(merchant.notes ?? []);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link
          href="/crm/merchants"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          Merchants
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-lg font-bold text-gray-900">
          {merchant.business_name || merchant.email}
        </h1>
        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            STATUS_COLORS[merchant.status] || 'bg-gray-100 text-gray-600'
          }`}
        >
          {merchant.status}
        </span>
      </div>

      {/* 3-panel layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_340px] gap-6">
        {/* LEFT: Profile */}
        <div className="space-y-4">
          {/* Identity */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              {merchant.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={merchant.logo_url}
                  alt="Logo"
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: merchant.primary_color || '#6366f1' }}
                >
                  {(merchant.business_name || merchant.email)[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">
                  {merchant.business_name || 'Unnamed'}
                </p>
                {merchant.business_type && (
                  <p className="text-xs text-gray-400 capitalize">{merchant.business_type}</p>
                )}
              </div>
            </div>

            {merchant.business_description && (
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                {merchant.business_description}
              </p>
            )}

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-gray-400 shrink-0" />
                <span className="truncate">{merchant.email}</span>
              </div>
              {merchant.phone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-gray-400 shrink-0" />
                  <span>{merchant.phone}</span>
                </div>
              )}
              {merchant.website_url && (
                <div className="flex items-center gap-2">
                  <Globe size={14} className="text-gray-400 shrink-0" />
                  <a
                    href={merchant.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-brand-green-dark hover:underline truncate"
                  >
                    {merchant.website_url}
                  </a>
                </div>
              )}
              {merchant.location && (
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-gray-400 shrink-0" />
                  <span>{merchant.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pipedrive History */}
          {pipedriveData && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <GitBranch size={14} className="text-[#4A90D9]" />
                Pipedrive History
              </h3>

              {/* Contact person */}
              {pipedriveData.contact_person && (
                <div className="flex items-center gap-2 mb-2">
                  <User size={13} className="text-gray-400 shrink-0" />
                  <div>
                    <span className="text-[11px] text-gray-400 block">Contact Person</span>
                    <span className="text-sm font-medium text-gray-800">{pipedriveData.contact_person}</span>
                  </div>
                </div>
              )}

              {/* Label badge */}
              {pipedriveData.pipedrive_label && (
                <div className="mb-3">
                  <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${LABEL_COLORS[pipedriveData.pipedrive_label] ?? 'bg-gray-100 text-gray-600'}`}>
                    {pipedriveData.pipedrive_label}
                  </span>
                </div>
              )}

              {/* Stage */}
              {pipedriveData.pipedrive_stage && (
                <div className="flex items-center gap-2 mb-2 text-sm">
                  <Briefcase size={13} className="text-gray-400 shrink-0" />
                  <div>
                    <span className="text-[11px] text-gray-400 block">Pipedrive Stage</span>
                    <span className="text-sm text-gray-700">{pipedriveData.pipedrive_stage}</span>
                  </div>
                </div>
              )}

              {/* Owner */}
              {pipedriveData.pipedrive_owner && (
                <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                  <User size={13} className="text-gray-400 shrink-0" />
                  <span className="text-[11px] text-gray-400">Owner: </span>
                  <span className="text-sm text-gray-700">{pipedriveData.pipedrive_owner}</span>
                </div>
              )}

              {/* Lost reason - prominent */}
              {pipedriveData.lost_reason && (
                <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2.5 flex items-start gap-2">
                  <XCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-semibold text-red-600 block">Lost Reason</span>
                    <span className="text-xs text-red-700">{pipedriveData.lost_reason}</span>
                  </div>
                </div>
              )}

              {/* Activities */}
              {(pipedriveData.activities_total ?? 0) > 0 && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <Activity size={13} className="text-gray-400 shrink-0" />
                  <span className="text-xs text-gray-500">Activities: </span>
                  <span className="text-xs font-semibold text-gray-700">
                    {pipedriveData.activities_done ?? 0} / {pipedriveData.activities_total}
                  </span>
                </div>
              )}

              {/* Deal ID */}
              {pipedriveData.pipedrive_deal_id && (
                <div className="mt-2 text-[11px] text-gray-400">
                  Deal #{pipedriveData.pipedrive_deal_id}
                  {pipedriveData.last_activity_date && (
                    <span className="ml-2">· Last activity: {new Date(pipedriveData.last_activity_date).toLocaleDateString()}</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Revenue */}
          <div className="bg-white rounded-xl border border-gray-200 p-5" id="revenue-section">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <DollarSign size={16} className="text-green-600" />
              Revenue
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Lifetime</p>
                <p className="text-lg font-bold text-gray-900">
                  ฿{(merchant.lifetime_revenue || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">This Month</p>
                <p className="text-lg font-bold text-gray-900">
                  ฿{(merchant.monthly_revenue || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* CRM fields */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">CRM</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Health score</span>
                <span
                  className={`font-bold ${
                    (merchant.health_score || 0) >= 70
                      ? 'text-green-600'
                      : (merchant.health_score || 0) >= 40
                      ? 'text-amber-600'
                      : 'text-red-600'
                  }`}
                >
                  {merchant.health_score ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Source</span>
                <span className="text-gray-700">{merchant.utm_source || 'direct'}</span>
              </div>
              {merchant.utm_campaign && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Campaign</span>
                  <span className="text-gray-700 truncate max-w-[120px]">{merchant.utm_campaign}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Joined</span>
                <span className="text-gray-700">
                  {new Date(merchant.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Status change */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <label className="text-xs font-medium text-gray-500 block mb-1">Change status</label>
              <select
                value={merchant.status}
                onChange={(e) => updateStatus(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-green bg-white"
              >
                {['lead', 'onboarding', 'onboarded', 'active', 'dormant', 'churned'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          {merchant.tags && merchant.tags.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                <Tag size={14} />
                Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {merchant.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Handoffs */}
          {handoffs.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1">
                <AlertCircle size={14} className="text-red-500" />
                Handoffs ({handoffs.length})
              </h3>
              <div className="space-y-2">
                {handoffs.slice(0, 3).map((h) => (
                  <div key={h.id} className="text-xs border border-gray-100 rounded-lg p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`font-medium ${
                          h.status === 'resolved' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {h.status}
                      </span>
                      <span className="text-gray-400">
                        {new Date(h.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">{h.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CENTER: Timeline / Conversation tabs */}
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100 px-4">
            <button
              onClick={() => setActivePanel('timeline')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activePanel === 'timeline'
                  ? 'border-brand-green text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Activity Timeline
            </button>
            <button
              onClick={() => setActivePanel('conversation')}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                activePanel === 'conversation'
                  ? 'border-brand-green text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              AI Conversation
              {conversations.length > 0 && (
                <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {conversations.length}
                </span>
              )}
            </button>
          </div>

          <div className="p-5 flex-1 overflow-auto">
            {activePanel === 'timeline' ? (
              <MerchantTimeline events={events} />
            ) : (
              <ConversationView messages={conversations} />
            )}
          </div>
        </div>

        {/* RIGHT: Notes */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1">
              <Edit3 size={14} />
              Notes
            </h3>

            {/* Add note */}
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
              />
              <button
                onClick={saveNote}
                disabled={!newNote.trim() || savingNote}
                className="mt-2 w-full py-1.5 bg-brand-green hover:bg-brand-green-dark text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {savingNote ? 'Saving…' : 'Add Note'}
              </button>
            </div>

            {/* Existing notes */}
            {merchant.notes && merchant.notes.filter((n) => n.type !== 'pipedrive_import' && n.text).length > 0 ? (
              <div className="space-y-3">
                {[...merchant.notes].filter((n) => n.type !== 'pipedrive_import' && n.text).reverse().map((note, i) => (
                  <div key={i} className="border-l-2 border-brand-green pl-3">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span className="font-medium">{String(note.author ?? 'Team')}</span>
                      <span>{note.date ? new Date(String(note.date)).toLocaleDateString() : ''}</span>
                    </div>
                    <p className="text-sm text-gray-700">{String(note.text ?? '')}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">No notes yet</p>
            )}
          </div>

          {/* Onboarding progress */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle size={14} className="text-brand-green-dark" />
              Onboarding Progress
            </h3>
            {[
              { id: 'context', label: 'Business Context' },
              { id: 'branding', label: 'Branding' },
              { id: 'products', label: 'Products' },
              { id: 'rewards', label: 'Rewards' },
              { id: 'golive', label: 'Go Live' },
            ].map((phase) => {
              const phases = ['context', 'branding', 'products', 'rewards', 'golive', 'completed'];
              const currentIdx = phases.indexOf(merchant.onboarding_status);
              const phaseIdx = phases.indexOf(phase.id);
              const isDone = phaseIdx < currentIdx || merchant.onboarding_status === 'completed';
              const isCurrent = merchant.onboarding_status === phase.id;

              return (
                <div key={phase.id} className="flex items-center gap-2 py-1.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                      isDone
                        ? 'bg-brand-green'
                        : isCurrent
                        ? 'bg-amber-400'
                        : 'bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {isDone && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4L3 6L7 2" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {isCurrent && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span
                    className={`text-xs ${
                      isDone ? 'text-gray-700' : isCurrent ? 'text-amber-700 font-medium' : 'text-gray-400'
                    }`}
                  >
                    {phase.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-amber-600 ml-auto">In progress</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-1">
              <Clock size={14} />
              Quick Actions
            </h3>
            <div className="space-y-2">
              <Link
                href={`/crm/handoffs?merchantId=${merchant.id}`}
                className="flex items-center justify-center gap-2 w-full py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                <AlertCircle size={14} />
                View Handoffs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
