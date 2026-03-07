'use client';
import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, ChevronDown, ChevronUp, Download, X, Eye, Pencil, Users,
  CheckSquare, Square, Filter
} from 'lucide-react';

export interface MerchantRow {
  id: string;
  email: string;
  business_name: string | null;
  business_type: string | null;
  status: string;
  onboarding_status: string;
  utm_source: string | null;
  health_score: number | null;
  created_at: string;
  last_activity_at: string | null;
  assigned_to?: string | null;
  lifetime_revenue?: number | null;
  monthly_revenue?: number | null;
  phone?: string | null;
  line_id?: string | null;
  location?: string | null;
  notes?: unknown;
  tags?: string[] | null;
}

type SortOption = 'newest' | 'oldest' | 'name_az' | 'revenue_high' | 'health_low';

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; tab: string }> = {
  lead:       { bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-400',   tab: '#3B82F6' },
  onboarding: { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-400',  tab: '#F5A623' },
  onboarded:  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400', tab: '#8B5CF6' },
  active:     { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-500',  tab: '#4CAF50' },
  churned:    { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-400',    tab: '#E57373' },
  lost:       { bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-300',    tab: '#EF4444' },
  dormant:    { bg: 'bg-gray-100',   text: 'text-gray-600',   border: 'border-gray-300',   tab: '#9CA3AF' },
};

const LABEL_COLORS: Record<string, string> = {
  'Corporate':        'bg-blue-100 text-blue-700',
  'SME':              'bg-green-100 text-green-700',
  'Micro Enterprise': 'bg-amber-100 text-amber-700',
};

const PAGE_SIZES = [25, 50, 100];

const STAGE_LABELS: Record<string, string> = {
  'Prospecting': 'Prospect',
  'Connected': 'Connected',
  'Discovery': 'Discovery',
  'Negotiation': 'Negotiation',
  'Closed Won': 'Won',
};

function formatCurrency(val: number | null | undefined): string {
  if (!val) return '—';
  if (val >= 1000000) return `฿${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `฿${(val / 1000).toFixed(0)}K`;
  return `฿${val.toLocaleString()}`;
}

function relativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function getLabel(m: MerchantRow): string {
  if (!m.tags) return '';
  for (const tag of m.tags) {
    if (tag.startsWith('pipedrive_label:')) {
      return tag.replace('pipedrive_label:', '');
    }
  }
  // fallback to notes
  try {
    const notes = m.notes as Record<string, unknown> | null;
    if (notes?.pipedrive_label) return String(notes.pipedrive_label);
  } catch {}
  return '';
}

function getStage(m: MerchantRow): string {
  if (!m.tags) return '';
  for (const tag of m.tags) {
    if (tag.startsWith('pipedrive_stage:')) {
      return tag.replace('pipedrive_stage:', '');
    }
  }
  try {
    const notes = m.notes as Record<string, unknown> | null;
    if (notes?.pipedrive_stage) return String(notes.pipedrive_stage);
  } catch {}
  return '';
}

function getContactPerson(m: MerchantRow): string {
  try {
    const notes = m.notes as Record<string, unknown> | null;
    if (notes?.contact_person) return String(notes.contact_person);
    if (notes?.pipedrive_owner) return String(notes.pipedrive_owner);
  } catch {}
  return '';
}

function avatarColor(name: string): string {
  const colors = [
    'bg-blue-200 text-blue-800', 'bg-green-200 text-green-800',
    'bg-purple-200 text-purple-800', 'bg-amber-200 text-amber-800',
    'bg-pink-200 text-pink-800', 'bg-cyan-200 text-cyan-800',
    'bg-indigo-200 text-indigo-800', 'bg-rose-200 text-rose-800',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface MerchantTableProps {
  merchants: MerchantRow[];
  initialStatus?: string;
  onStatusChange?: (merchantId: string, newStatus: string) => Promise<void>;
}

export function MerchantTable({ merchants, initialStatus, onStatusChange }: MerchantTableProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(initialStatus || '');
  const [search, setSearch] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [labelFilter, setLabelFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [revenueFilter, setRevenueFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [bulkOwner, setBulkOwner] = useState('');

  // Compute status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { '': merchants.length };
    for (const m of merchants) {
      counts[m.status] = (counts[m.status] || 0) + 1;
    }
    return counts;
  }, [merchants]);

  // Get unique owners
  const owners = useMemo(() => {
    const set = new Set<string>();
    for (const m of merchants) {
      if (m.assigned_to) set.add(m.assigned_to);
    }
    return Array.from(set).sort();
  }, [merchants]);

  // Get unique labels
  const labels = useMemo(() => {
    const set = new Set<string>();
    for (const m of merchants) {
      const l = getLabel(m);
      if (l) set.add(l);
    }
    return Array.from(set).sort();
  }, [merchants]);

  // Get unique stages
  const stages = useMemo(() => {
    const set = new Set<string>();
    for (const m of merchants) {
      const s = getStage(m);
      if (s) set.add(s);
    }
    return Array.from(set).sort();
  }, [merchants]);

  const activeFilterCount = [ownerFilter, labelFilter, stageFilter, revenueFilter].filter(Boolean).length;

  const filtered = useMemo(() => {
    let list = [...merchants];

    // Tab filter
    if (activeTab) list = list.filter((m) => m.status === activeTab);

    // Search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((m) => {
        const contact = getContactPerson(m).toLowerCase();
        return (
          m.email.toLowerCase().includes(q) ||
          (m.business_name || '').toLowerCase().includes(q) ||
          contact.includes(q)
        );
      });
    }

    // Owner
    if (ownerFilter) list = list.filter((m) => m.assigned_to === ownerFilter);

    // Label
    if (labelFilter) {
      if (labelFilter === '__unlabeled__') {
        list = list.filter((m) => !getLabel(m));
      } else {
        list = list.filter((m) => getLabel(m) === labelFilter);
      }
    }

    // Stage
    if (stageFilter) list = list.filter((m) => getStage(m) === stageFilter);

    // Revenue
    if (revenueFilter === 'has') list = list.filter((m) => (m.lifetime_revenue || 0) > 0);
    if (revenueFilter === 'none') list = list.filter((m) => !(m.lifetime_revenue || 0));

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'name_az') return (a.business_name || a.email).localeCompare(b.business_name || b.email);
      if (sortBy === 'revenue_high') return (b.lifetime_revenue || 0) - (a.lifetime_revenue || 0);
      if (sortBy === 'health_low') return (a.health_score || 0) - (b.health_score || 0);
      return 0;
    });

    return list;
  }, [merchants, activeTab, search, ownerFilter, labelFilter, stageFilter, revenueFilter, sortBy]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const totalRevenue = filtered.reduce((s, m) => s + (m.lifetime_revenue || 0), 0);
    const withHealth = filtered.filter((m) => m.health_score !== null);
    const avgHealth = withHealth.length
      ? Math.round(withHealth.reduce((s, m) => s + (m.health_score || 0), 0) / withHealth.length)
      : null;
    const withContact = filtered.filter((m) => getContactPerson(m) || m.phone).length;
    const withRevenue = filtered.filter((m) => (m.lifetime_revenue || 0) > 0).length;
    return { total, totalRevenue, avgHealth, withContact, withRevenue };
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = paginated.length > 0 && paginated.every((m) => selected.has(m.id));

  const resetPage = useCallback(() => setPage(1), []);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected((prev) => { const next = new Set(prev); paginated.forEach((m) => next.delete(m.id)); return next; });
    } else {
      setSelected((prev) => { const next = new Set(prev); paginated.forEach((m) => next.add(m.id)); return next; });
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const exportSelected = () => {
    const rows = filtered.filter((m) => selected.has(m.id));
    const csv = [
      ['Name', 'Email', 'Status', 'Label', 'Stage', 'Owner', 'Revenue', 'Health', 'Created'].join(','),
      ...rows.map((m) => [
        `"${m.business_name || ''}"`,
        m.email,
        m.status,
        `"${getLabel(m)}"`,
        `"${getStage(m)}"`,
        `"${m.assigned_to || ''}"`,
        m.lifetime_revenue ?? '',
        m.health_score ?? '',
        new Date(m.created_at).toLocaleDateString(),
      ].join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'merchants.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setOwnerFilter(''); setLabelFilter(''); setStageFilter(''); setRevenueFilter(''); setSearch(''); resetPage();
  };

  const TABS = [
    { label: 'All', value: '' },
    { label: 'Leads', value: 'lead' },
    { label: 'Onboarding', value: 'onboarding' },
    { label: 'Active', value: 'active' },
    { label: 'Onboarded', value: 'onboarded' },
    { label: 'Churned', value: 'churned' },
    { label: 'Lost', value: 'lost' },
  ];

  return (
    <div className="space-y-3">
      {/* === TABS === */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto">
          {TABS.map((tab) => {
            const count = statusCounts[tab.value] || 0;
            const isActive = activeTab === tab.value;
            const color = tab.value ? STATUS_COLORS[tab.value]?.tab : '#4A90D9';
            return (
              <button
                key={tab.value}
                onClick={() => { setActiveTab(tab.value); resetPage(); setSelected(new Set()); }}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? 'text-gray-900 bg-white'
                    : 'text-gray-500 hover:text-gray-700 border-transparent hover:bg-gray-50'
                }`}
                style={isActive ? { borderBottomColor: color } : {}}
              >
                {tab.label}
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    isActive ? 'text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                  style={isActive ? { backgroundColor: color } : {}}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* === FILTER BAR === */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email, contact..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); resetPage(); }}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50"
            />
          </div>

          {/* Owner */}
          <select
            value={ownerFilter}
            onChange={(e) => { setOwnerFilter(e.target.value); resetPage(); }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">All owners</option>
            {owners.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>

          {/* Label */}
          <select
            value={labelFilter}
            onChange={(e) => { setLabelFilter(e.target.value); resetPage(); }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">All labels</option>
            {labels.map((l) => <option key={l} value={l}>{l}</option>)}
            <option value="__unlabeled__">Unlabeled</option>
          </select>

          {/* Stage */}
          {stages.length > 0 && (
            <select
              value={stageFilter}
              onChange={(e) => { setStageFilter(e.target.value); resetPage(); }}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              <option value="">All stages</option>
              {stages.map((s) => <option key={s} value={s}>{STAGE_LABELS[s] || s}</option>)}
            </select>
          )}

          {/* Revenue */}
          <select
            value={revenueFilter}
            onChange={(e) => { setRevenueFilter(e.target.value); resetPage(); }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="">All revenue</option>
            <option value="has">Has revenue</option>
            <option value="none">No revenue</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as SortOption); resetPage(); }}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name_az">Name A–Z</option>
            <option value="revenue_high">Highest revenue</option>
            <option value="health_low">Lowest health</option>
          </select>

          {/* Active filter badge */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-1 rounded-full">
                <Filter size={10} /> {activeFilterCount} active
              </span>
              <button
                onClick={clearFilters}
                className="text-[12px] text-gray-400 hover:text-gray-700 flex items-center gap-0.5"
              >
                <X size={12} /> Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* === STATS BAR === */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px]">
        <span className="text-gray-500">
          Showing <span className="font-semibold text-gray-900">{Math.min((page - 1) * pageSize + 1, stats.total)}–{Math.min(page * pageSize, stats.total)}</span> of <span className="font-semibold text-gray-900">{stats.total}</span> merchants
        </span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">Total Revenue: <span className="font-semibold text-gray-900">{formatCurrency(stats.totalRevenue)}</span></span>
        {stats.avgHealth !== null && (
          <>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">Avg Health: <span className="font-semibold text-gray-900">{stats.avgHealth}</span></span>
          </>
        )}
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">With Contact: <span className="font-semibold text-gray-900">{stats.total ? Math.round(stats.withContact / stats.total * 100) : 0}%</span></span>
        <span className="text-gray-400">|</span>
        <span className="text-gray-500">With Revenue: <span className="font-semibold text-gray-900">{stats.total ? Math.round(stats.withRevenue / stats.total * 100) : 0}%</span></span>
      </div>

      {/* === BULK ACTION BAR === */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 bg-[#4A90D9] text-white px-4 py-2.5 rounded-xl shadow">
          <CheckSquare size={15} />
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <div className="h-4 w-px bg-white/30" />
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={bulkOwner}
              onChange={(e) => setBulkOwner(e.target.value)}
              className="text-[12px] bg-white/20 text-white border border-white/30 rounded-md px-2 py-1 focus:outline-none"
            >
              <option value="" className="text-gray-800">Assign owner...</option>
              {owners.map((o) => <option key={o} value={o} className="text-gray-800">{o}</option>)}
            </select>
            <button
              onClick={exportSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[12px] font-medium rounded-md transition-colors"
            >
              <Download size={12} /> Export CSV
            </button>
            <button
              onClick={() => { setSelected(new Set()); setBulkOwner(''); }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded-md transition-colors"
            >
              <X size={12} /> Deselect
            </button>
            <button
              onClick={() => {
                setSelected(new Set(filtered.map((m) => m.id)));
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded-md transition-colors"
            >
              <Square size={12} /> Select all ({filtered.length})
            </button>
          </div>
        </div>
      )}

      {/* === TABLE === */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="pl-4 pr-2 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-300"
                  />
                </th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 text-[12px] whitespace-nowrap">Merchant</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 text-[12px]">Label</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 text-[12px]">Status</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 text-[12px]">Stage</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 text-[12px]">Owner</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 text-[12px]">Revenue</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 text-[12px]">Health</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 text-[12px] whitespace-nowrap">Last Active</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500 text-[12px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((m) => {
                const label = getLabel(m);
                const stage = getStage(m);
                const contact = getContactPerson(m);
                const sc = STATUS_COLORS[m.status];
                const initial = (m.business_name || m.email)[0]?.toUpperCase() || '?';
                const aColor = avatarColor(m.business_name || m.email);
                const ownerShort = m.assigned_to ? m.assigned_to.split(' ').slice(0, 2).join(' ') : '—';

                return (
                  <tr
                    key={m.id}
                    onClick={() => router.push(`/crm/merchants/${m.id}`)}
                    className={`border-b border-gray-50 hover:bg-blue-50/20 transition-colors cursor-pointer ${
                      selected.has(m.id) ? 'bg-blue-50/40' : ''
                    }`}
                  >
                    <td className="pl-4 pr-2 py-3 w-8" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(m.id)}
                        onChange={() => {}}
                        onClick={(e) => toggleSelect(m.id, e)}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-300"
                      />
                    </td>

                    {/* Merchant */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0 ${aColor}`}>
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-[13px] truncate max-w-[160px]">
                            {m.business_name || '—'}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{m.email}</p>
                          {contact && (
                            <p className="text-[11px] text-gray-500 truncate max-w-[160px]">👤 {contact}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Label */}
                    <td className="px-3 py-3">
                      {label ? (
                        <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full ${LABEL_COLORS[label] || 'bg-gray-100 text-gray-600'}`}>
                          {label}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-[12px]">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <span className={`inline-block text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${sc ? `${sc.bg} ${sc.text}` : 'bg-gray-100 text-gray-600'}`}>
                        {m.status}
                      </span>
                    </td>

                    {/* Stage */}
                    <td className="px-3 py-3">
                      {stage ? (
                        <span className="text-[12px] text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {STAGE_LABELS[stage] || stage}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-[12px]">—</span>
                      )}
                    </td>

                    {/* Owner */}
                    <td className="px-3 py-3">
                      <span className="text-[12px] text-gray-600 truncate max-w-[100px] block">{ownerShort}</span>
                    </td>

                    {/* Revenue */}
                    <td className="px-3 py-3">
                      <span className={`text-[13px] font-medium ${(m.lifetime_revenue || 0) > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                        {formatCurrency(m.lifetime_revenue)}
                      </span>
                    </td>

                    {/* Health */}
                    <td className="px-3 py-3">
                      {m.health_score !== null && m.health_score !== undefined ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                m.health_score >= 70 ? 'bg-green-500' :
                                m.health_score >= 40 ? 'bg-amber-500' : 'bg-red-400'
                              }`}
                              style={{ width: `${m.health_score}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-bold ${
                            m.health_score >= 70 ? 'text-green-600' :
                            m.health_score >= 40 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {m.health_score}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-[12px]">—</span>
                      )}
                    </td>

                    {/* Last Active */}
                    <td className="px-3 py-3 text-[12px] text-gray-400 whitespace-nowrap">
                      {relativeTime(m.last_activity_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => router.push(`/crm/merchants/${m.id}`)}
                          className="p-1.5 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          title="View"
                        >
                          <Eye size={13} />
                        </button>
                        <a
                          href={`/crm/merchants/${m.id}`}
                          className="p-1.5 text-gray-300 hover:text-green-500 hover:bg-green-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users size={28} className="opacity-40" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">No merchants found</p>
                        <p className="text-[13px] text-gray-400 mt-1">Try adjusting your filters or search query</p>
                      </div>
                      {activeFilterCount > 0 && (
                        <button
                          onClick={clearFilters}
                          className="text-[13px] text-blue-500 hover:underline"
                        >
                          Clear all filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* === PAGINATION === */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/60">
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-500">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="text-[12px] border border-gray-200 rounded px-2 py-1 bg-white"
              >
                {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[12px] text-gray-500 mr-2">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length}
              </span>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 text-[12px] border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-2.5 py-1 text-[12px] border rounded transition-colors ${
                      p === page ? 'bg-[#4A90D9] text-white border-[#4A90D9]' : 'border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 text-[12px] border border-gray-200 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
