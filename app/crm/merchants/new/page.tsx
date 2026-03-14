'use client';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Loader2,
  Sparkles,
  Globe,
  Phone,
  Mail,
  MessageSquare,
  Building2,
  MapPin,
  Tag,
  Calendar,
  User,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Zap,
  Copy,
  Check,
  Plus,
  X,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResearchResult {
  website: string | null;
  industry: string | null;
  description: string | null;
  employee_estimate: string | null;
  location_details: string | null;
  key_products: string[];
  pain_points: string[];
  monetization_opportunities: string[];
  bd_talking_points: string[];
  social: {
    facebook: string | null;
    instagram: string | null;
    line_oa: string | null;
    tiktok: string | null;
  };
}

interface FormData {
  // Contact
  email: string;
  phone: string;
  line_id: string;
  // Business
  business_name: string;
  business_type: string;
  business_size: string;
  business_description: string;
  location: string;
  website_url: string;
  // Social
  social_facebook: string;
  social_instagram: string;
  social_tiktok: string;
  // CRM
  status: string;
  assigned_to: string;
  tags: string[];
  next_follow_up_at: string;
  // Source
  utm_source: string;
  referrer_url: string;
  // Notes
  initial_note: string;
}

const BUSINESS_TYPES = [
  { value: 'food', label: '🍜 Food & Beverage' },
  { value: 'retail', label: '🛍️ Retail' },
  { value: 'beauty', label: '💅 Beauty & Wellness' },
  { value: 'fitness', label: '💪 Fitness' },
  { value: 'hospitality', label: '🏨 Hospitality' },
  { value: 'education', label: '📚 Education' },
  { value: 'events', label: '🎉 Events' },
  { value: 'creator', label: '🎨 Creator' },
  { value: 'ngo', label: '🤝 NGO / Non-profit' },
  { value: 'other', label: '📦 Other' },
];

const BUSINESS_SIZES = [
  { value: 'solo', label: 'Solo / 1 person' },
  { value: '2-5', label: '2–5 people' },
  { value: '6-20', label: '6–20 people' },
  { value: '21-50', label: '21–50 people' },
  { value: '50+', label: '50+ people' },
];

const STATUS_OPTIONS = [
  { value: 'lead', label: '🔵 Lead', desc: 'Prospect not yet contacted' },
  { value: 'onboarding', label: '🟡 Onboarding', desc: 'In setup / trial' },
  { value: 'onboarded', label: '🟣 Onboarded', desc: 'Setup done' },
  { value: 'active', label: '🟢 Active / Won', desc: 'Transacting on Freedom' },
];

const SOURCE_OPTIONS = [
  'cold_outreach', 'referral', 'inbound', 'event', 'partnership',
  'social_media', 'pipedrive_import', 'other',
];

const BD_TEAM = ['Kevin', 'Beam', 'Gift', 'Nook', 'Pam', 'Pop', 'Fah'];

// ─── Field component ──────────────────────────────────────────────────────────

function Field({
  label, required, hint, children,
}: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[12px] font-semibold text-gray-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = 'text', prefix, onBlur,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; prefix?: React.ReactNode; onBlur?: () => void;
}) {
  return (
    <div className="relative">
      {prefix && (
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
          {prefix}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full ${prefix ? 'pl-8' : 'pl-3'} pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/30 focus:border-[#4A90D9] bg-white placeholder:text-gray-400`}
      />
    </div>
  );
}

function Textarea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/30 focus:border-[#4A90D9] bg-white placeholder:text-gray-400 resize-none"
    />
  );
}

function Select({
  value, onChange, options, placeholder,
}: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none pl-3 pr-8 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/30 focus:border-[#4A90D9] bg-white text-gray-700"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  );
}

// ─── Research Panel ───────────────────────────────────────────────────────────

function ResearchPanel({
  businessName,
  websiteUrl,
  onApply,
}: {
  businessName: string;
  websiteUrl: string;
  onApply: (r: ResearchResult) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const runResearch = async () => {
    if (!businessName.trim()) {
      setError('Enter a business name first.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Use a stub merchant ID pattern — we'll create the merchant after form submission.
      // For research-before-creation we call the enrich endpoint with a temp approach:
      // Instead, we'll call a lightweight inline research route.
      const res = await fetch('/api/crm/research-prospect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessName, websiteUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Research failed');
      setResult(data.research);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Research failed');
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="space-y-4">
      {/* Research trigger */}
      <div className="bg-gradient-to-br from-[#4A90D9]/5 to-white border border-[#4A90D9]/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#4A90D9]/10 flex items-center justify-center">
            <Sparkles size={14} className="text-[#4A90D9]" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-900">AI Research</p>
            <p className="text-[11px] text-gray-500">Auto-fill from business name + website</p>
          </div>
        </div>
        <button
          onClick={runResearch}
          disabled={loading || !businessName.trim()}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-[#4A90D9] hover:bg-[#357ABD] disabled:opacity-40 text-white text-[12px] font-semibold rounded-lg transition-colors"
        >
          {loading ? (
            <><Loader2 size={13} className="animate-spin" /> Researching…</>
          ) : (
            <><Search size={13} /> Research This Business</>
          )}
        </button>
        {error && (
          <p className="mt-2 text-[11px] text-red-500 flex items-center gap-1">
            <AlertCircle size={11} /> {error}
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Apply banner */}
          <button
            onClick={() => onApply(result)}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-[12px] font-semibold rounded-lg transition-colors"
          >
            <CheckCircle2 size={13} /> Apply to Form
          </button>

          {/* Description */}
          {result.description && (
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Overview</p>
              <p className="text-[12px] text-gray-700 leading-relaxed">{result.description}</p>
            </div>
          )}

          {/* BD Talking Points */}
          {result.bd_talking_points?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">BD Talking Points</p>
                <button
                  onClick={() => copyText(result.bd_talking_points.join('\n'), 'bd')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copied === 'bd' ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                </button>
              </div>
              <ul className="space-y-1">
                {result.bd_talking_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12px] text-gray-700">
                    <Zap size={10} className="text-[#4A90D9] mt-0.5 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pain Points */}
          {result.pain_points?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Pain Points</p>
              <ul className="space-y-1">
                {result.pain_points.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12px] text-gray-600">
                    <AlertCircle size={10} className="text-amber-500 mt-0.5 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Opportunities */}
          {result.monetization_opportunities?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Monetization Opportunities</p>
              <ul className="space-y-1">
                {result.monetization_opportunities.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[12px] text-gray-600">
                    <CheckCircle2 size={10} className="text-green-500 mt-0.5 shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Social Links found */}
          {(result.social?.facebook || result.social?.instagram || result.social?.tiktok || result.website) && (
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Found Links</p>
              <div className="space-y-1">
                {result.website && (
                  <a href={result.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-[#4A90D9] hover:underline truncate">
                    <Globe size={11} /> {result.website}
                  </a>
                )}
                {result.social?.facebook && (
                  <a href={result.social.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-[#4A90D9] hover:underline truncate">
                    <Globe size={11} /> Facebook
                  </a>
                )}
                {result.social?.instagram && (
                  <a href={result.social.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-[#4A90D9] hover:underline truncate">
                    <Globe size={11} /> Instagram
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tags input ───────────────────────────────────────────────────────────────

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');

  const add = () => {
    const val = input.trim().toLowerCase().replace(/\s+/g, '-');
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setInput('');
  };

  const remove = (t: string) => onChange(tags.filter((x) => x !== t));

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder="Add tag…"
          className="flex-1 px-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/30 focus:border-[#4A90D9] bg-white"
        />
        <button
          type="button"
          onClick={add}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[12px] font-medium transition-colors"
        >
          <Plus size={13} />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] rounded-full">
              {t}
              <button type="button" onClick={() => remove(t)} className="hover:text-red-500">
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
          {icon}
        </div>
        <p className="text-[13px] font-semibold text-gray-900">{title}</p>
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EMPTY: FormData = {
  email: '', phone: '', line_id: '',
  business_name: '', business_type: '', business_size: '', business_description: '',
  location: '', website_url: '',
  social_facebook: '', social_instagram: '', social_tiktok: '',
  status: 'lead', assigned_to: '', tags: [], next_follow_up_at: '',
  utm_source: '', referrer_url: '',
  initial_note: '',
};

export default function AddMerchantPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState<'draft' | 'open' | null>(null);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const set = useCallback((key: keyof FormData, value: unknown) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  }, []);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.business_name.trim()) errs.business_name = 'Business name is required';
    return errs;
  };

  const submit = async (mode: 'draft' | 'open') => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setSaving(mode);
    setError('');

    try {
      const payload: Record<string, unknown> = {
        email: form.email.trim(),
        business_name: form.business_name.trim(),
        status: form.status || 'lead',
      };

      if (form.phone.trim()) payload.phone = form.phone.trim();
      if (form.line_id.trim()) payload.line_id = form.line_id.trim();
      if (form.business_type) payload.business_type = form.business_type;
      if (form.business_size) payload.business_size = form.business_size;
      if (form.business_description.trim()) payload.business_description = form.business_description.trim();
      if (form.location.trim()) payload.location = form.location.trim();
      if (form.website_url.trim()) payload.website_url = form.website_url.trim();
      if (form.assigned_to) payload.assigned_to = form.assigned_to;
      if (form.tags.length > 0) payload.tags = form.tags;
      if (form.next_follow_up_at) payload.next_follow_up_at = form.next_follow_up_at;
      if (form.utm_source) payload.utm_source = form.utm_source;
      if (form.referrer_url.trim()) payload.referrer_url = form.referrer_url.trim();

      // Social URLs
      const social: Record<string, string> = {};
      if (form.social_facebook.trim()) social.facebook = form.social_facebook.trim();
      if (form.social_instagram.trim()) social.instagram = form.social_instagram.trim();
      if (form.social_tiktok.trim()) social.tiktok = form.social_tiktok.trim();
      if (Object.keys(social).length > 0) payload.social_urls = social;

      // Initial note
      if (form.initial_note.trim()) {
        payload.notes = [{
          type: 'note',
          text: form.initial_note.trim(),
          author: 'BD Team',
          created_at: new Date().toISOString(),
        }];
      }

      const res = await fetch('/api/merchants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create merchant');
      }

      if (mode === 'open') {
        router.push(`/crm/merchants/${data.merchant.id}`);
      } else {
        router.push('/crm/merchants');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      setSaving(null);
    }
  };

  const applyResearch = (r: ResearchResult) => {
    if (r.description && !form.business_description) set('business_description', r.description);
    if (r.location_details && !form.location) set('location', r.location_details);
    if (r.website && !form.website_url) set('website_url', r.website);
    if (r.social?.facebook && !form.social_facebook) set('social_facebook', r.social.facebook);
    if (r.social?.instagram && !form.social_instagram) set('social_instagram', r.social.instagram);
    if (r.social?.tiktok && !form.social_tiktok) set('social_tiktok', r.social.tiktok);
    if (r.industry && !form.business_type) {
      // Map AI industry to our enum
      const lower = r.industry.toLowerCase();
      if (lower.includes('food') || lower.includes('restaurant') || lower.includes('cafe') || lower.includes('beverage')) set('business_type', 'food');
      else if (lower.includes('retail') || lower.includes('fashion')) set('business_type', 'retail');
      else if (lower.includes('beauty') || lower.includes('wellness') || lower.includes('spa')) set('business_type', 'beauty');
      else if (lower.includes('fitness') || lower.includes('gym') || lower.includes('sport')) set('business_type', 'fitness');
      else if (lower.includes('hotel') || lower.includes('hospit')) set('business_type', 'hospitality');
      else if (lower.includes('educat') || lower.includes('school') || lower.includes('tutor')) set('business_type', 'education');
      else if (lower.includes('event')) set('business_type', 'events');
      else if (lower.includes('creator') || lower.includes('influenc') || lower.includes('content')) set('business_type', 'creator');
      else if (lower.includes('ngo') || lower.includes('nonprofit') || lower.includes('charity')) set('business_type', 'ngo');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/crm/merchants"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-[18px] font-bold text-gray-900">Add Merchant</h1>
            <p className="text-[12px] text-gray-500">Create a new lead or merchant record</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/crm/merchants"
            className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={() => submit('draft')}
            disabled={!!saving}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
          >
            {saving === 'draft' ? <Loader2 size={13} className="animate-spin" /> : null}
            Save as Lead
          </button>
          <button
            onClick={() => submit('open')}
            disabled={!!saving}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold bg-[#4A90D9] hover:bg-[#357ABD] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {saving === 'open' ? <Loader2 size={13} className="animate-spin" /> : null}
            Save & Open Profile
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 max-w-[1200px] mx-auto">
          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[13px] rounded-xl">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 items-start">
            {/* ── Left: Form ── */}
            <div className="space-y-5">
              {/* Contact Info */}
              <Section title="Contact Information" icon={<Mail size={14} />}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Business Name" required>
                      <Input
                        value={form.business_name}
                        onChange={(v) => set('business_name', v)}
                        placeholder="e.g. Café de Flore"
                        prefix={<Building2 size={13} />}
                      />
                      {fieldErrors.business_name && (
                        <p className="text-[11px] text-red-500 mt-0.5">{fieldErrors.business_name}</p>
                      )}
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Email" required hint="Used as the unique merchant identifier">
                      <Input
                        value={form.email}
                        onChange={(v) => set('email', v)}
                        type="email"
                        placeholder="owner@business.com"
                        prefix={<Mail size={13} />}
                      />
                      {fieldErrors.email && (
                        <p className="text-[11px] text-red-500 mt-0.5">{fieldErrors.email}</p>
                      )}
                    </Field>
                  </div>
                  <Field label="Phone" hint="Thai mobile e.g. 0812345678">
                    <Input
                      value={form.phone}
                      onChange={(v) => set('phone', v)}
                      placeholder="08x-xxx-xxxx"
                      prefix={<Phone size={13} />}
                    />
                  </Field>
                  <Field label="LINE ID" hint="Personal or LINE OA">
                    <Input
                      value={form.line_id}
                      onChange={(v) => set('line_id', v)}
                      placeholder="@lineid or username"
                      prefix={<MessageSquare size={13} />}
                    />
                  </Field>
                </div>
              </Section>

              {/* Business Details */}
              <Section title="Business Details" icon={<Building2 size={14} />}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Business Type">
                    <Select
                      value={form.business_type}
                      onChange={(v) => set('business_type', v)}
                      options={BUSINESS_TYPES}
                      placeholder="Select type…"
                    />
                  </Field>
                  <Field label="Business Size">
                    <Select
                      value={form.business_size}
                      onChange={(v) => set('business_size', v)}
                      options={BUSINESS_SIZES}
                      placeholder="Select size…"
                    />
                  </Field>
                  <div className="col-span-2">
                    <Field label="Location" hint="City, district, or neighbourhood in Thailand">
                      <Input
                        value={form.location}
                        onChange={(v) => set('location', v)}
                        placeholder="e.g. Silom, Bangkok"
                        prefix={<MapPin size={13} />}
                      />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Website URL">
                      <Input
                        value={form.website_url}
                        onChange={(v) => set('website_url', v)}
                        placeholder="https://…"
                        prefix={<Globe size={13} />}
                      />
                    </Field>
                  </div>
                  <div className="col-span-2">
                    <Field label="Business Description" hint="What they do, who they serve, market position">
                      <Textarea
                        value={form.business_description}
                        onChange={(v) => set('business_description', v)}
                        placeholder="Short description of the business…"
                        rows={3}
                      />
                    </Field>
                  </div>
                </div>
              </Section>

              {/* Social Media */}
              <Section title="Social Media" icon={<Globe size={14} />}>
                <div className="grid grid-cols-1 gap-3">
                  <Field label="Facebook Page URL">
                    <Input
                      value={form.social_facebook}
                      onChange={(v) => set('social_facebook', v)}
                      placeholder="https://facebook.com/page"
                    />
                  </Field>
                  <Field label="Instagram URL">
                    <Input
                      value={form.social_instagram}
                      onChange={(v) => set('social_instagram', v)}
                      placeholder="https://instagram.com/handle"
                    />
                  </Field>
                  <Field label="TikTok URL">
                    <Input
                      value={form.social_tiktok}
                      onChange={(v) => set('social_tiktok', v)}
                      placeholder="https://tiktok.com/@handle"
                    />
                  </Field>
                </div>
              </Section>

              {/* CRM Setup */}
              <Section title="CRM Setup" icon={<User size={14} />}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Field label="Pipeline Status">
                      <div className="grid grid-cols-2 gap-2">
                        {STATUS_OPTIONS.map((s) => (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => set('status', s.value)}
                            className={`flex flex-col items-start px-3 py-2.5 rounded-lg border text-left transition-colors ${
                              form.status === s.value
                                ? 'border-[#4A90D9] bg-[#4A90D9]/5'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <span className="text-[12px] font-semibold text-gray-900">{s.label}</span>
                            <span className="text-[11px] text-gray-500">{s.desc}</span>
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>
                  <Field label="Assign To">
                    <div className="relative">
                      <select
                        value={form.assigned_to}
                        onChange={(e) => set('assigned_to', e.target.value)}
                        className="w-full appearance-none pl-8 pr-8 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/30 focus:border-[#4A90D9] bg-white"
                      >
                        <option value="">Unassigned</option>
                        {BD_TEAM.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <User size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </Field>
                  <Field label="Next Follow-up">
                    <div className="relative">
                      <input
                        type="date"
                        value={form.next_follow_up_at}
                        onChange={(e) => set('next_follow_up_at', e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A90D9]/30 focus:border-[#4A90D9] bg-white"
                      />
                      <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </Field>
                  <div className="col-span-2">
                    <Field label="Tags" hint="Press Enter to add — e.g. vip, food-court, pipedrive">
                      <TagInput tags={form.tags} onChange={(t) => set('tags', t)} />
                    </Field>
                  </div>
                </div>
              </Section>

              {/* Source */}
              <Section title="Lead Source" icon={<Tag size={14} />}>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Source">
                    <Select
                      value={form.utm_source}
                      onChange={(v) => set('utm_source', v)}
                      options={SOURCE_OPTIONS.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
                      placeholder="Select source…"
                    />
                  </Field>
                  <Field label="Referrer / Campaign URL">
                    <Input
                      value={form.referrer_url}
                      onChange={(v) => set('referrer_url', v)}
                      placeholder="https://…"
                    />
                  </Field>
                </div>
              </Section>

              {/* Initial Note */}
              <Section title="Initial Note" icon={<MessageSquare size={14} />}>
                <Field label="First contact note" hint="Saved as the first activity on this merchant">
                  <Textarea
                    value={form.initial_note}
                    onChange={(v) => set('initial_note', v)}
                    placeholder="How did you find this merchant? What was discussed? Any context for the team…"
                    rows={4}
                  />
                </Field>
              </Section>
            </div>

            {/* ── Right: Research Panel ── */}
            <div className="space-y-4 lg:sticky lg:top-5">
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-widest">
                BD Research
              </p>
              <ResearchPanel
                businessName={form.business_name}
                websiteUrl={form.website_url}
                onApply={applyResearch}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
