# Sprint 2A: Cloudflare + Vercel API Clients

## Objective
Create API client modules for Cloudflare DNS management and Vercel project management inside the freedom-api backend service.

## Working Directory
`/clawd/bd/freedom-api/`

## Context
Read the existing codebase at `/clawd/bd/freedom-api/` first — it's a standalone Express + TypeScript API service created in Sprint 1A. It already has lib modules for Railway (`lib/railway.ts`) and GitHub (`lib/github.ts`). We need to add Cloudflare and Vercel clients in the same pattern.

## Task 1: Cloudflare DNS Client

Create: `lib/cloudflare.ts`

**Env vars used:**
- `CLOUDFLARE_API_TOKEN` — Bearer token for Cloudflare API
- `CLOUDFLARE_ZONE_ID` — Zone ID for freedom.world

**Functions to implement:**

```typescript
// Create a CNAME record: {slug}.app.freedom.world → cname.vercel-dns.com
export async function createMerchantDnsRecord(slug: string): Promise<{ recordId: string; domain: string }>

// Delete a CNAME record by record ID (for merchant removal/cleanup)
export async function deleteDnsRecord(recordId: string): Promise<void>

// List all DNS records matching *.app.freedom.world (for admin/debugging)
export async function listMerchantDnsRecords(): Promise<Array<{ id: string; name: string; content: string; type: string }>>

// Check if a DNS record already exists for a slug
export async function dnsRecordExists(slug: string): Promise<boolean>
```

**Cloudflare API reference:**
- Base URL: `https://api.cloudflare.com/client/v4`
- Auth: `Authorization: Bearer {token}`
- Create record: `POST /zones/{zone_id}/dns_records` body: `{ type: "CNAME", name: "{slug}.app.freedom.world", content: "cname.vercel-dns.com", proxied: false, ttl: 1 }`
- Delete record: `DELETE /zones/{zone_id}/dns_records/{record_id}`
- List records: `GET /zones/{zone_id}/dns_records?type=CNAME&name=contains:app.freedom.world`

**Important:** `proxied: false` — we want DNS-only (gray cloud), not Cloudflare proxy. Vercel handles SSL.

## Task 2: Vercel Project Management Client

Create: `lib/vercel.ts`

**Env vars used:**
- `VERCEL_TOKEN` — Vercel API token
- `VERCEL_TEAM_ID` — (optional) Vercel team ID for team-scoped projects

**Functions to implement:**

```typescript
// Create a new Vercel project linked to a GitHub repo
export async function createVercelProject(
  slug: string,
  githubRepoFullName: string  // e.g. "khwk-kevin/fw-app-bkm-thai"
): Promise<{ projectId: string; projectUrl: string }>

// Assign a custom domain to a Vercel project
export async function assignVercelDomain(
  projectId: string,
  domain: string  // e.g. "bkm-thai.app.freedom.world"
): Promise<void>

// Get the latest deployment status for a project
export async function getDeploymentStatus(
  projectId: string
): Promise<{ status: string; url: string | null; readyAt: string | null }>

// Delete a Vercel project (cleanup)
export async function deleteVercelProject(projectId: string): Promise<void>

// Trigger a redeployment (after git push)
export async function triggerRedeployment(projectId: string): Promise<{ deploymentId: string }>
```

**Vercel API reference:**
- Base URL: `https://api.vercel.com`
- Auth: `Authorization: Bearer {token}`
- Team scope: append `?teamId={team_id}` to all URLs if VERCEL_TEAM_ID is set
- Create project: `POST /v10/projects` body: `{ name: "fw-app-{slug}", framework: "nextjs", gitRepository: { type: "github", repo: "{owner}/{repo}" } }`
- Add domain: `POST /v10/projects/{projectId}/domains` body: `{ name: "{domain}" }`
- Get deployments: `GET /v6/deployments?projectId={projectId}&limit=1`
- Delete project: `DELETE /v9/projects/{projectId}`
- Trigger redeploy: `POST /v13/deployments` body: `{ name: "fw-app-{slug}", target: "production", gitSource: { type: "github", repo: "{owner}/{repo}", ref: "main" } }`

## Task 3: Integration types

Create: `lib/types/deploy.ts` (or add to existing `lib/types.ts`)

```typescript
export interface DeployResult {
  success: boolean;
  productionUrl: string | null;
  vercelProjectId: string | null;
  cloudflareRecordId: string | null;
  error?: string;
}
```

## Constraints
- Follow the same code style as existing `lib/railway.ts` and `lib/github.ts`
- Use native `fetch` (no axios)
- Proper TypeScript types for all API responses
- Error handling: throw descriptive errors with API status codes
- All functions should be idempotent where possible (check if exists before creating)
- Do NOT modify any files outside `/clawd/bd/freedom-api/`

## Verification
Run `npx tsc --noEmit` from `/clawd/bd/freedom-api/` to verify no type errors.
