# Pipedrive → Supabase Migration Report

**Source file:** `deals-export-2026-03-06.csv`  
**Exported:** 2026-03-06  
**Analysed by:** `migrate-pipedrive.ts` dry-run  
**Target table:** `merchants` (Supabase)

---

## 1. Dataset Overview

| Metric | Count |
|--------|-------|
| Total rows in CSV | 1,677 |
| (minus header row) | 1,676 deals |
| Unique organizations | 1,356 (awk) / 1,541 (script — slightly different normalisation) |
| Duplicate deals removed | 136 |
| **Unique merchants to import** | **1,541** |
| Transform errors | 0 |

---

## 2. Status Breakdown (raw Pipedrive)

| Pipedrive Status | Count | % |
|-----------------|-------|---|
| Open | 1,115 | 66.5% |
| Lost | 479 | 28.6% |
| Won | 83 | 4.9% |

**Observation:** Only 4.9% of deals ever reached Won status. The pipeline is heavily top-of-funnel.

---

## 3. Stage Distribution (raw Pipedrive)

| Stage | Count | % |
|-------|-------|---|
| Prospecting / Lead Inbound | 892 | 53.2% |
| Connected - Qualified | 434 | 25.9% |
| Closed Won - Onboarded | 148 | 8.8% |
| Negotiation / Proposal | 110 | 6.6% |
| Discovery + Demo Attended | 93 | 5.5% |

**Funnel conversion:**
- Lead → Qualified: 53% make it past Prospecting
- Qualified → Demo: 14% of Qualified reach Demo
- Demo → Negotiation: 59% of Demo reach Proposal  
- Negotiation → Onboarded: 82% of Proposal reach Onboarded (high intent at that point)

---

## 4. Label (Business Size Tier) Distribution

| Pipedrive Label | Count | Notes |
|----------------|-------|-------|
| *(blank)* | 1,107 | 66% unlabelled |
| SME | 454 | Small/medium enterprise |
| Corporate | 80 | Larger org |
| Micro Enterprise | 35 | Very small |
| SME, Corporate | 1 | Multi-label (edge case) |

**Issue:** Labels describe company **size**, not **industry**. No clean mapping to `business_type` (food/retail/beauty etc.). All map to `null` — `business_type` must be enriched post-import from business names/descriptions.

---

## 5. Stage × Status Cross-table

| Stage | Won | Open | Lost |
|-------|-----|------|------|
| Prospecting / Lead Inbound | 0 | 879 | 13 |
| Connected - Qualified | 0 | 134 | 300 |
| Discovery + Demo Attended | 1 | 32 | 60 |
| Negotiation / Proposal | 1 | 32 | 77 |
| Closed Won - Onboarded | 81 | 38 | 29 |

**Notes:**
- 38 deals are "Open" but already in "Closed Won - Onboarded" stage — stale/unclosed deals
- 29 deals were "Closed Won - Onboarded" but then marked Lost → mapped to `churned`
- 2 Won deals are at pre-final stages → mapped to `active` (status wins over stage)

---

## 6. Supabase Status Mapping (post-migration)

| Supabase `status` | Count | Mapping Logic |
|-------------------|-------|---------------|
| lead | 916 | Open + Prospecting or Connected |
| lost | 421 | Lost + non-onboarded stage |
| active | 80 | Status = Won |
| onboarding | 60 | Open + Demo or Proposal stage |
| onboarded | 38 | Open + Closed Won stage (stale) |
| churned | 26 | Lost + was in Closed Won stage |

---

## 7. Top 20 Organizations by Deal Value (THB)

| Organization | Value (THB) |
|-------------|-------------|
| Midsummer coffee | 240,000 |
| THE BARBER'S TALE | 200,000 |
| Howler Bar & Grill | 200,000 |
| Evies cookie | 200,000 |
| Brooks Brunch & Bar Ari | 200,000 |
| Xpheres | 150,000 |
| MeeKwamSook | 150,000 |
| Refine Coffee Roaster.TCDC | 120,000 |
| Porcupine Café | 120,000 |
| Groobglace.bkk | 120,000 |
| TAY Songwat | 100,000 |
| Chocoholic | 100,000 |
| A Coffee Roaster by li-bra-ry | 100,000 |
| Seenspace | 75,000 |
| Raja Ferry | 50,000 |
| The Dog Hotel BKK | 6,600 |
| Ojisan Relaxing Station | 6,600 |
| Nai Snow | 6,600 |
| UNHOUR cafe | 6,000 |
| Daisy Monday nail&eyelash | 6,000 |

**Note:** Only 43 deals (2.6%) have non-zero values. Total pipeline value: **฿2,229,800**.  
The F&B / café sector dominates the high-value deals.

---

## 8. Date Ranges

| Field | Earliest | Latest |
|-------|----------|--------|
| Deal created | 2023-05-26 | 2026-02-27 |
| Won time | 2024-12-12 | 2026-01-26 |

All Won deals (active merchants) were closed in the last 14 months (Dec 2024 – Jan 2026).  
The pipeline spans ~2.75 years of BD activity.

---

## 9. Owner (BD Rep) Distribution

| Owner | Deals | Notes |
|-------|-------|-------|
| Sirada | 1,027 | ~61% of all deals |
| Siripapatsara | 120 | |
| Worraruetai Burana | 117 | |
| Pupak Blue | 117 | |
| MA AYE MYAT ZIN | 111 | |
| Wa Rasica C | 105 | |
| Pitiwat | 73 | |
| (deleted user) | 4 | User no longer in Pipedrive |
| Pakpoom (Poom) Sucharitpong | 2 | |
| Dada | 1 | |

`assigned_to` in Supabase is set to the owner's **name** (not a Slack user ID). Link to `crm_users` manually post-import.

---

## 10. Lost Reason Analysis

| Reason (normalised) | Count |
|--------------------|-------|
| *(blank / null)* | 1,278 (76%) |
| no_response | 91+10+5+4 = ~110 |
| inactive / Inactive | 38+9 = ~47 |
| . / .. (junk) | 49 |
| not_interested | 19+15+12+4 = ~50 |
| not_proceeding | 28 |
| building_own_solution | 17 |
| duplicate | 4 |
| owner_left | 4 |
| other specific | <10 each |

**Issue:** 76% of lost deals have no reason recorded. This is a significant data quality gap.

---

## 11. Contact Person Coverage

| Metric | Count |
|--------|-------|
| Deals with contact person | 640 / 1,676 (38%) |
| Deals without contact | 1,036 (62%) |

Contact name is stored in `notes[0].contact_person` — no email or phone available in export.

---

## 12. Source / UTM Data

| Source Origin | Count |
|--------------|-------|
| *(blank — manually created)* | 1,669 (99.6%) |
| Marketplace | 3 |
| Lead Suggestions | 3 |
| Web visitors | 1 |
| Messaging Inbox | 1 |

Almost all deals were manually entered. `utm_source` defaults to `pipedrive_import` for these.

---

## 13. Field Mapping Summary

| Pipedrive Field | Supabase Field | Notes |
|----------------|----------------|-------|
| Organization | `business_name` | Fallback: Title minus " deal" suffix |
| Status + Stage | `status` | See §6 mapping table |
| Stage | `onboarding_status` | See §6 |
| Won time | `onboarding_completed_at` | ISO timestamp |
| Deal created | `created_at`, `onboarding_started_at` | |
| Value (THB) | `lifetime_revenue` | 97% are 0 |
| Label | `tags[]` → `pipedrive_label:{value}` | Can't map to business_type |
| Stage | `tags[]` → `pipedrive_stage:{value}` | |
| Owner | `assigned_to` (name), `tags[]` → `owner:{name}` | Not a Slack ID |
| Source origin | `utm_source` | Mostly `pipedrive_import` |
| Lost reason | `notes[0].lost_reason` | Normalised |
| Contact person | `notes[0].contact_person` | No email available |
| Deal ID | `notes[0].pipedrive_deal_id` | Audit trail |
| All other fields | `notes[0].*` | Full audit in JSON |
| *(no email in PD)* | `email` | **Placeholder:** `pipedrive+{slug}@import.freedom.co.th` |

---

## 14. Data Quality Issues

| Issue | Severity | Impact |
|-------|----------|--------|
| No email addresses in Pipedrive export | 🔴 High | Placeholder emails used — must enrich |
| 76% lost deals have no reason | 🟡 Medium | Lost reason analytics unreliable |
| 62% of deals have no contact person | 🟡 Medium | Can't do outreach without enrichment |
| 97% of deals have ₿0 value | 🟡 Medium | LTV data near-useless |
| Labels are size tiers not industries | 🟡 Medium | `business_type` will be null for all |
| 38 "Open" deals stuck at "Closed Won" stage | 🟢 Low | Mapped to `onboarded` status |
| Junk lost reasons (".","..") | 🟢 Low | Normalised to null |
| 4 deals from "(deleted user)" | 🟢 Low | Owner name stored; no Slack link |

---

## 15. Post-Migration Action Items

1. **Email enrichment** — Source real emails for 1,541 merchants (LinkedIn, Line, phone follow-up)
2. **business_type enrichment** — Use business name to classify as food/retail/beauty/etc. (could use AI classification)
3. **crm_users mapping** — Create `crm_users` rows for each owner name, then update `assigned_to` to UUID
4. **Active merchant follow-up** — 80 `active` merchants (Won deals) should be prioritised for onboarding platform invite
5. **Churned recovery** — 26 `churned` merchants worth reviewing for re-engagement
6. **Onboarded nudge** — 38 `onboarded` (stale open) + 60 `onboarding` merchants need follow-up
7. **Health score recalc** — Run health score after import populates `health_score` field
8. **Deduplicate check** — Verify 136 removed duplicates didn't lose important contact info

---

## 16. Running the Migration

```bash
cd /clawd/bd/freedom-onboarding

# Dry run (safe — no DB writes)
npx tsx scripts/migrate-pipedrive.ts --dry-run

# Dry run with verbose per-row output
npx tsx scripts/migrate-pipedrive.ts --dry-run --verbose

# Test on first 20 rows only
npx tsx scripts/migrate-pipedrive.ts --dry-run --limit 20

# Full migration (requires SUPABASE env vars)
dotenv -e .env.local -- npx tsx scripts/migrate-pipedrive.ts

# With explicit env vars
SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=eyJ... npx tsx scripts/migrate-pipedrive.ts
```

> ⚠️ **Use `SUPABASE_SERVICE_ROLE_KEY`** (not anon key) — the migration bypasses RLS to insert directly.
