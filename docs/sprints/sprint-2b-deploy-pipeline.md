# Sprint 2B: Rewrite Deploy Pipeline (Vercel + Cloudflare)

## Objective
Rewrite the deploy flow so merchant apps deploy as static sites to Vercel with Cloudflare DNS, instead of deploying to Railway.

## Working Directory
`/clawd/bd/freedom-api/`

## Context
Read these files first:
- `/clawd/bd/freedom-api/lib/deploy.ts` — current deploy flow (targets Railway, needs rewriting)
- `/clawd/bd/freedom-api/lib/cloudflare.ts` — Cloudflare DNS client (created in Sprint 2A)
- `/clawd/bd/freedom-api/lib/vercel.ts` — Vercel project client (created in Sprint 2A)
- `/clawd/bd/freedom-api/lib/railway.ts` — Railway SSH/build functions (still used for build container)
- `/clawd/bd/freedom-api/lib/github.ts` — GitHub repo management
- `/clawd/bd/freedom-api/lib/persistence.ts` — Supabase persistence

## Task 1: Rewrite `lib/deploy.ts`

The current `deployMerchantApp()` function does:
1. SSH: npm run build (in Railway service)
2. SSH: git commit + push
3. Switch Railway start command to `npm run start`
4. Assign Railway custom domain `{slug}.app.freedom.world`
5. Persist to Supabase

**New flow — rewrite to:**

```
deployMerchantApp(merchantId, spec):
  1. SSH into Railway BUILD CONTAINER: npm run build (verify static export succeeds)
     - Build container is a shared Railway service for running builds
     - NOT the merchant's production host
     - If build fails: auto-fix via Claude Code (keep existing retry logic)

  2. SSH into Railway build container: git add + commit + push to merchant's GitHub repo
     - Push to `main` branch
     - Vercel auto-deploys from GitHub push

  3. Vercel API: Create project (if not exists) linked to GitHub repo
     - Project name: `fw-app-{slug}`
     - Framework: nextjs
     - Linked to: `khwk-kevin/fw-app-{slug}`

  4. Vercel API: Assign domain `{slug}.app.freedom.world` to the project

  5. Cloudflare API: Create CNAME record
     - `{slug}.app.freedom.world` → `cname.vercel-dns.com`
     - Skip if record already exists (idempotent)

  6. Wait for Vercel deployment to be ready (poll status, max 120s)

  7. Persist to Supabase:
     - status: 'deployed'
     - productionUrl: `https://{slug}.app.freedom.world`
     - vercelProjectId
     - cloudflareRecordId
     - slug
     - deployedAt

  8. Return { productionUrl }
```

**Keep existing helper functions:**
- `generateSlug()` — keep as-is
- `checkSlugAvailable()` — keep as-is
- `resolveUniqueSlug()` — keep as-is
- `runBuildWithAutoFix()` — keep as-is (SSH into build container, retry with Claude Code)

**Update Supabase schema expectations:**
The `merchant_apps` table needs these columns (add to persistence if not there):
- `vercel_project_id` (text)
- `cloudflare_record_id` (text)
- `hosting_tier` (text, default 'free')

## Task 2: Create `lib/build-service.ts`

Manage the shared Railway build container:

```typescript
// Get or create the shared build container service
export async function getBuildService(): Promise<{ projectId: string; serviceId: string }>

// Clone a merchant's repo into the build container
export async function prepareBuildEnvironment(
  merchantGitUrl: string,
  merchantId: string
): Promise<void>

// Clean up after build (remove merchant's code from shared container)
export async function cleanupBuildEnvironment(merchantId: string): Promise<void>
```

The build container is a single shared Railway service (not per-merchant). Flow:
1. SSH in → `git clone {merchantRepo} /workspace/builds/{merchantId}`
2. `cd /workspace/builds/{merchantId} && npm install && npm run build`
3. If build succeeds → `git push`
4. Clean up → `rm -rf /workspace/builds/{merchantId}`

This avoids spinning up a new Railway service per merchant just for builds.

**Env vars:**
- `BUILD_SERVICE_PROJECT_ID` — Railway project ID for the build service
- `BUILD_SERVICE_ID` — Railway service ID for the build service

## Task 3: Update `lib/persistence.ts`

Add fields for Vercel + Cloudflare tracking:

```typescript
// Update the saveMerchantApp function to include new fields:
vercel_project_id?: string;
cloudflare_record_id?: string;
hosting_tier?: 'free' | 'pro';
```

Read the existing persistence.ts to understand the current shape and update accordingly.

## Constraints
- Do NOT modify files outside `/clawd/bd/freedom-api/`
- Keep the Railway SSH build logic (sshExecCommand, runBuildWithAutoFix) — it's still used for the build step
- The build happens in Railway, the hosting happens in Vercel — don't confuse the two
- All Vercel/Cloudflare calls should be idempotent (safe to retry)
- Error handling: if Cloudflare or Vercel fails, return descriptive error, don't leave half-deployed state

## Verification
Run `npx tsc --noEmit` from `/clawd/bd/freedom-api/` to verify no type errors.
