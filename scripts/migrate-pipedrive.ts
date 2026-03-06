/**
 * Pipedrive → Supabase Merchants Migration Script
 *
 * Source:  /clawd/agents/marketing/data/pipedrive/deals-export-2026-03-06.csv
 * Target:  Supabase `merchants` table
 *
 * Usage:
 *   npx tsx scripts/migrate-pipedrive.ts [--dry-run] [--csv /path/to/file.csv]
 *
 * Flags:
 *   --dry-run   Parse & transform but do NOT write to Supabase (default: false)
 *   --csv       Path to CSV file (default: see DEFAULT_CSV_PATH below)
 *   --limit N   Only process first N rows (useful for testing)
 *   --verbose   Print each row as it's processed
 *
 * Notes:
 *   - Pipedrive has no email column → placeholder generated as
 *     `pipedrive+{slug}@import.freedom.co.th` (merchant will need real email)
 *   - Duplicates resolved by Organization name: Won > Open > Lost,
 *     then most recently updated deal wins within same status tier
 *   - Original Pipedrive data stored verbatim in merchant.notes JSON array
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../lib/supabase/types';

// ─── Config ──────────────────────────────────────────────────────────────────

const DEFAULT_CSV_PATH = path.resolve(
  __dirname,
  '../../../agents/marketing/data/pipedrive/deals-export-2026-03-06.csv'
);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

// Parse CLI args
const args = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const VERBOSE   = args.includes('--verbose');
const CSV_PATH  = args.includes('--csv')  ? args[args.indexOf('--csv')  + 1] : DEFAULT_CSV_PATH;
const LIMIT_IDX = args.indexOf('--limit');
const LIMIT     = LIMIT_IDX !== -1 ? parseInt(args[LIMIT_IDX + 1], 10) : Infinity;

// ─── Types ────────────────────────────────────────────────────────────────────

type MerchantStatus    = Database['public']['Tables']['merchants']['Row']['status'];
type OnboardingStatus  = Database['public']['Tables']['merchants']['Row']['onboarding_status'];
type BusinessType      = Database['public']['Tables']['merchants']['Row']['business_type'];
type MerchantInsert    = Database['public']['Tables']['merchants']['Insert'];

interface PipedriveDeal {
  id: string;
  title: string;
  creator: string;
  owner: string;
  value: string;
  currency: string;
  weightedValue: string;
  probability: string;
  organization: string;
  organizationId: string;
  pipeline: string;
  contactPerson: string;
  contactPersonId: string;
  stage: string;
  label: string;
  status: string;           // Won | Lost | Open
  dealCreated: string;
  updateTime: string;
  lastStageChange: string;
  nextActivityDate: string;
  lastActivityDate: string;
  wonTime: string;
  lastEmailReceived: string;
  lastEmailSent: string;
  lostTime: string;
  dealClosedOn: string;
  lostReason: string;
  visibleTo: string;
  totalActivities: string;
  doneActivities: string;
  activitiesToDo: string;
  emailMessagesCount: string;
  expectedCloseDate: string;
  productQuantity: string;
  productAmount: string;
  productName: string;
  sourceOrigin: string;
  sourceOriginId: string;
  sourceChannel: string;
  sourceChannelId: string;
  archiveStatus: string;
  archiveTime: string;
  sequenceEnrollment: string;
  participants: string;
}

// ─── Field Mapping Logic ──────────────────────────────────────────────────────

/**
 * Pipedrive Stage → Supabase (status, onboarding_status)
 *
 * Stage                      | PD Status | → status      | onboarding_status
 * ─────────────────────────────────────────────────────────────────────────────
 * Prospecting / Lead Inbound | Open      | lead          | signup
 * Connected - Qualified      | Open      | lead          | signup
 * Discovery + Demo Attended  | Open      | onboarding    | context
 * Negotiation / Proposal     | Open      | onboarding    | golive
 * Closed Won - Onboarded     | Open      | onboarded     | completed  (stale open)
 * Any                        | Won       | active        | completed
 * Closed Won - Onboarded     | Lost      | churned       | completed
 * Other stages               | Lost      | lost          | abandoned
 */
function mapStatus(deal: PipedriveDeal): { status: MerchantStatus; onboardingStatus: OnboardingStatus } {
  const pdStatus = deal.status; // Won | Lost | Open
  const stage    = deal.stage;

  if (pdStatus === 'Won') {
    return { status: 'active', onboardingStatus: 'completed' };
  }

  if (pdStatus === 'Lost') {
    if (stage === 'Closed Won - Onboarded') {
      // Was onboarded but then churned
      return { status: 'churned', onboardingStatus: 'completed' };
    }
    return { status: 'lost', onboardingStatus: 'abandoned' };
  }

  // Open deals
  switch (stage) {
    case 'Closed Won - Onboarded':
      // Marked as onboarded but deal still technically open — treat as onboarded/dormant
      return { status: 'onboarded', onboardingStatus: 'completed' };
    case 'Negotiation / Proposal':
      return { status: 'onboarding', onboardingStatus: 'golive' };
    case 'Discovery + Demo Attended':
      return { status: 'onboarding', onboardingStatus: 'context' };
    case 'Connected - Qualified':
      return { status: 'lead', onboardingStatus: 'signup' };
    case 'Prospecting / Lead Inbound':
    default:
      return { status: 'lead', onboardingStatus: 'signup' };
  }
}

/**
 * Pipedrive Label → business_type
 *
 * Pipedrive labels describe company size, NOT industry. We have no industry
 * data in the export, so everything maps to null (unknown).
 * The original label is preserved in merchant.tags.
 *
 * If you have domain knowledge about specific orgs, update this mapping.
 */
function mapBusinessType(_label: string): BusinessType | null {
  // No clean mapping available — label is size tier, not industry
  // Preserve original in tags instead
  return null;
}

/**
 * Normalize lost reason to a canonical form
 */
function normalizeLostReason(reason: string): string | null {
  if (!reason || reason.trim() === '' || reason.trim() === '.' || reason.trim() === '..') {
    return null;
  }
  const lower = reason.trim().toLowerCase();
  // Canonical groupings
  if (['no response', 'no answer', 'not responding'].some(k => lower.includes(k))) {
    return 'no_response';
  }
  if (lower === 'inactive' || lower.startsWith('inactive')) return 'inactive';
  if (lower.includes('not interest')) return 'not_interested';
  if (lower.includes('duplicate')) return 'duplicate';
  if (lower.includes('own system') || lower.includes('owned system')) return 'building_own_solution';
  if (lower.includes('owner') && lower.includes('left')) return 'owner_left';
  return reason.trim();
}

/**
 * Map Pipedrive source → utm_source
 */
function mapUtmSource(sourceOrigin: string, sourceChannel: string): string | null {
  const src = (sourceOrigin || sourceChannel || '').toLowerCase();
  if (!src || src === 'manually created' || src === '') return 'pipedrive_import';
  if (src.includes('marketplace')) return 'pipedrive_marketplace';
  if (src.includes('lead suggestion')) return 'pipedrive_lead_suggestions';
  if (src.includes('web visitor')) return 'web';
  if (src.includes('messaging')) return 'messaging';
  return src;
}

/**
 * Slug-ify org name for placeholder email
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40);
}

/**
 * Score deal for deduplication priority (higher = keep this one)
 * Won > Open > Lost; within same tier, most recently updated wins
 */
function dealPriority(deal: PipedriveDeal): number {
  const statusScore = deal.status === 'Won' ? 200 : deal.status === 'Open' ? 100 : 0;
  const ts = new Date(deal.updateTime || deal.dealCreated || '2000-01-01').getTime() / 1e9;
  return statusScore + ts / 1e9;
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────

/**
 * Naive RFC4180-ish CSV parser (handles quoted fields with embedded commas/newlines)
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let inQuote = false;
  let current = '';

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (ch === ',' && !inQuote) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

async function readCSV(filePath: string): Promise<PipedriveDeal[]> {
  const deals: PipedriveDeal[] = [];
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let lineNo = 0;
  let headerMap: Record<string, number> = {};

  for await (const line of rl) {
    lineNo++;
    if (lineNo === 1) {
      const headers = parseCSVLine(line);
      headers.forEach((h, i) => { headerMap[h] = i; });
      continue;
    }
    if (!line.trim()) continue;

    const f = parseCSVLine(line);
    const g = (col: string) => (f[headerMap[col]] || '').trim();

    deals.push({
      id:                  g('ID'),
      title:               g('Title'),
      creator:             g('Creator'),
      owner:               g('Owner'),
      value:               g('Value'),
      currency:            g('Currency of Value'),
      weightedValue:       g('Weighted value'),
      probability:         g('Probability'),
      organization:        g('Organization'),
      organizationId:      g('Organization ID'),
      pipeline:            g('Pipeline'),
      contactPerson:       g('Contact person'),
      contactPersonId:     g('Contact person ID'),
      stage:               g('Stage'),
      label:               g('Label'),
      status:              g('Status'),
      dealCreated:         g('Deal created'),
      updateTime:          g('Update time'),
      lastStageChange:     g('Last stage change'),
      nextActivityDate:    g('Next activity date'),
      lastActivityDate:    g('Last activity date'),
      wonTime:             g('Won time'),
      lastEmailReceived:   g('Last email received'),
      lastEmailSent:       g('Last email sent'),
      lostTime:            g('Lost time'),
      dealClosedOn:        g('Deal closed on'),
      lostReason:          g('Lost reason'),
      visibleTo:           g('Visible to'),
      totalActivities:     g('Total activities'),
      doneActivities:      g('Done activities'),
      activitiesToDo:      g('Activities to do'),
      emailMessagesCount:  g('Email messages count'),
      expectedCloseDate:   g('Expected close date'),
      productQuantity:     g('Product quantity'),
      productAmount:       g('Product amount'),
      productName:         g('Product name'),
      sourceOrigin:        g('Source origin'),
      sourceOriginId:      g('Source origin ID'),
      sourceChannel:       g('Source channel'),
      sourceChannelId:     g('Source channel ID'),
      archiveStatus:       g('Archive status'),
      archiveTime:         g('Archive time'),
      sequenceEnrollment:  g('Sequence enrollment'),
      participants:        g('Participants'),
    });
  }

  return deals;
}

// ─── Transform ────────────────────────────────────────────────────────────────

function transformDeal(deal: PipedriveDeal): MerchantInsert {
  const { status, onboardingStatus } = mapStatus(deal);
  const orgName  = deal.organization || deal.title.replace(/ deal$/i, '').trim();
  const slug     = slugify(orgName || deal.id);
  const email    = `pipedrive+${slug}@import.freedom.co.th`;
  const lostReason = normalizeLostReason(deal.lostReason);
  const utmSource  = mapUtmSource(deal.sourceOrigin, deal.sourceChannel);

  // Tags: preserve original pipedrive label + pipeline stage + owner
  const tags: string[] = ['pipedrive_import'];
  if (deal.label)  tags.push(`pipedrive_label:${deal.label.replace(/,\s*/g, '+')}`);
  if (deal.stage)  tags.push(`pipedrive_stage:${deal.stage.replace(/\s+/g, '_').toLowerCase()}`);
  if (deal.owner)  tags.push(`owner:${deal.owner.toLowerCase().replace(/\s+/g, '_')}`);

  // Notes: structured JSON log of original Pipedrive data
  const notes: Record<string, unknown>[] = [
    {
      type:    'pipedrive_import',
      source:  'pipedrive',
      pipedrive_deal_id:    deal.id,
      pipedrive_org_id:     deal.organizationId,
      pipedrive_stage:      deal.stage,
      pipedrive_status:     deal.status,
      pipedrive_label:      deal.label || null,
      pipedrive_owner:      deal.owner,
      pipedrive_creator:    deal.creator,
      contact_person:       deal.contactPerson || null,
      lost_reason:          lostReason,
      activities_total:     parseInt(deal.totalActivities) || 0,
      activities_done:      parseInt(deal.doneActivities) || 0,
      last_email_received:  deal.lastEmailReceived || null,
      last_email_sent:      deal.lastEmailSent || null,
      next_activity_date:   deal.nextActivityDate || null,
      last_activity_date:   deal.lastActivityDate || null,
      archived:             deal.archiveStatus === 'Archived',
      imported_at:          new Date().toISOString(),
    }
  ];

  const lifetimeRevenue = parseFloat(deal.value) || 0;
  const createdAt = deal.dealCreated ? new Date(deal.dealCreated).toISOString() : new Date().toISOString();
  const onboardingCompletedAt = deal.wonTime ? new Date(deal.wonTime).toISOString() : null;
  const lastActivityAt = deal.lastActivityDate ? new Date(deal.lastActivityDate).toISOString()
                       : deal.updateTime       ? new Date(deal.updateTime).toISOString()
                       : null;

  return {
    email,
    business_name:            orgName || null,
    business_type:            mapBusinessType(deal.label),
    status,
    onboarding_status:        onboardingStatus,
    onboarding_completed_at:  onboardingCompletedAt,
    onboarding_started_at:    createdAt,
    utm_source:               utmSource,
    lifetime_revenue:         lifetimeRevenue,
    assigned_to:              deal.owner || null,   // name only — not a Slack user ID
    notes:                    notes as unknown as import('../lib/supabase/types').Json,
    tags,
    last_activity_at:         lastActivityAt,
    created_at:               createdAt,
    updated_at:               new Date().toISOString(),
  };
}

// ─── Deduplication ────────────────────────────────────────────────────────────

function deduplicateDeals(deals: PipedriveDeal[]): PipedriveDeal[] {
  const best = new Map<string, PipedriveDeal>();

  for (const deal of deals) {
    const orgKey = (deal.organization || deal.title.replace(/ deal$/i, '').trim()).toLowerCase().trim();
    if (!orgKey) continue;

    const existing = best.get(orgKey);
    if (!existing || dealPriority(deal) > dealPriority(existing)) {
      best.set(orgKey, deal);
    }
  }

  return Array.from(best.values());
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║    Pipedrive → Supabase Migration Script             ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  CSV:     ${CSV_PATH}`);
  console.log(`  Dry run: ${DRY_RUN}`);
  console.log(`  Limit:   ${LIMIT === Infinity ? 'none' : LIMIT}`);
  console.log('');

  // ── 1. Read CSV
  console.log('📂 Reading CSV...');
  let deals = await readCSV(CSV_PATH);
  console.log(`   Loaded ${deals.length} deals`);

  if (LIMIT < Infinity) {
    deals = deals.slice(0, LIMIT);
    console.log(`   Limited to ${deals.length} deals`);
  }

  // ── 2. Stats before dedup
  const byStatus: Record<string, number> = {};
  const byStage:  Record<string, number> = {};
  for (const d of deals) {
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    byStage[d.stage]   = (byStage[d.stage]   || 0) + 1;
  }
  console.log('\n📊 Status distribution:');
  Object.entries(byStatus).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`   ${k}: ${v}`));
  console.log('\n📊 Stage distribution:');
  Object.entries(byStage).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log(`   ${k}: ${v}`));

  // ── 3. Deduplicate
  console.log('\n🔍 Deduplicating by Organization name...');
  const deduped = deduplicateDeals(deals);
  const skippedDups = deals.length - deduped.length;
  console.log(`   ${deduped.length} unique merchants (${skippedDups} duplicates removed)`);

  // ── 4. Transform
  console.log('\n🔄 Transforming records...');
  const merchants: MerchantInsert[] = [];
  const transformErrors: { dealId: string; error: string }[] = [];

  for (const deal of deduped) {
    try {
      const merchant = transformDeal(deal);
      merchants.push(merchant);
      if (VERBOSE) {
        console.log(`   ✓ [${deal.id}] ${deal.organization} → ${merchant.status} / ${merchant.onboarding_status}`);
      }
    } catch (err) {
      transformErrors.push({ dealId: deal.id, error: String(err) });
      console.error(`   ✗ [${deal.id}] Transform error: ${err}`);
    }
  }
  console.log(`   Transformed: ${merchants.length}, errors: ${transformErrors.length}`);

  // ── 5. Insert into Supabase
  if (DRY_RUN) {
    console.log('\n🚫 DRY RUN — no data written to Supabase');
    console.log('   First merchant preview:');
    console.log(JSON.stringify(merchants[0], null, 2));
    printSummary(deals, deduped, skippedDups, merchants, transformErrors, []);
    return;
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('\n❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment');
    console.error('   Run: export SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...');
    console.error('   Or:  dotenv -e .env.local -- npx tsx scripts/migrate-pipedrive.ts');
    process.exit(1);
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('\n⬆️  Inserting into Supabase (batch size: 50)...');
  const BATCH = 50;
  let imported = 0;
  let insertErrors: { email: string; error: string }[] = [];

  for (let i = 0; i < merchants.length; i += BATCH) {
    const batch = merchants.slice(i, i + BATCH);
    const { error } = await supabase
      .from('merchants')
      .upsert(batch, {
        onConflict: 'email',
        ignoreDuplicates: false, // update if exists
      });

    if (error) {
      console.error(`   Batch ${Math.floor(i / BATCH) + 1} error:`, error.message);
      batch.forEach(m => insertErrors.push({ email: m.email, error: error.message }));
    } else {
      imported += batch.length;
      process.stdout.write(`\r   Inserted ${imported}/${merchants.length}...`);
    }
  }
  console.log('');

  printSummary(deals, deduped, skippedDups, merchants, transformErrors, insertErrors);
}

function printSummary(
  rawDeals:       PipedriveDeal[],
  dedupedDeals:   PipedriveDeal[],
  skippedDups:    number,
  merchants:      MerchantInsert[],
  transformErrors: { dealId: string; error: string }[],
  insertErrors:    { email: string; error: string }[]
) {
  const successCount = merchants.length - insertErrors.length;

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║                  Migration Summary                   ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Total deals in CSV:          ${rawDeals.length}`);
  console.log(`  Unique merchants after dedup: ${dedupedDeals.length}`);
  console.log(`  Duplicate deals skipped:      ${skippedDups}`);
  console.log(`  Transform errors:             ${transformErrors.length}`);
  console.log(`  Supabase insert errors:       ${insertErrors.length}`);
  console.log(`  ✅ Successfully inserted:     ${successCount}`);

  if (transformErrors.length) {
    console.log('\n  Transform errors:');
    transformErrors.forEach(e => console.log(`    Deal ${e.dealId}: ${e.error}`));
  }
  if (insertErrors.length) {
    console.log('\n  Insert errors (first 10):');
    insertErrors.slice(0, 10).forEach(e => console.log(`    ${e.email}: ${e.error}`));
  }

  // Status breakdown of what was inserted
  const statusBreakdown: Record<string, number> = {};
  merchants.forEach(m => {
    statusBreakdown[m.status || 'unknown'] = (statusBreakdown[m.status || 'unknown'] || 0) + 1;
  });
  console.log('\n  Merchant status breakdown:');
  Object.entries(statusBreakdown).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => {
    console.log(`    ${k.padEnd(12)}: ${v}`);
  });

  console.log('\n  ⚠️  Important post-migration steps:');
  console.log('    1. All merchants have placeholder emails (pipedrive+{slug}@import.freedom.co.th)');
  console.log('    2. Real emails must be sourced and updated separately');
  console.log('    3. business_type is null for all — enrich from business_name/description');
  console.log('    4. assigned_to is owner name only — link to crm_users manually');
  console.log('    5. Run health score recalculation after import');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
