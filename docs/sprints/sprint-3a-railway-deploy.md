# Sprint 3A: Deploy freedom-api to Railway + Wire Frontend

## Objective
Deploy the Express API service to Railway and update the frontend to call it.

## Part 1: Deploy freedom-api to Railway

### 1.1 Create GitHub repo for freedom-api
- Initialize git in `/clawd/bd/freedom-api/`
- Create repo `khwk-kevin/freedom-api` on GitHub using the GitHub API
- Push all code

Use the GitHub token from env: `GITHUB_TOKEN`
GitHub org: `khwk-kevin`

```bash
cd /clawd/bd/freedom-api
git init
git add -A
git commit -m "init: freedom-api backend service"
# Create repo via GitHub API, then push
```

### 1.2 Create Railway service via Railway GraphQL API

Use the existing Railway GraphQL API functions. The Railway API token is in env: `RAILWAY_TEAM_TOKEN` or `RAILWAY_API_TOKEN`.

Read `/clawd/bd/freedom-api/lib/app-builder/railway.ts` to understand the GraphQL helper (`railwayGql`). You can reuse this pattern but run it as a standalone script.

**Create a deploy script at `/clawd/bd/freedom-api/scripts/deploy-to-railway.ts`:**

Using the Railway GraphQL API (https://backboard.railway.com/graphql/v2):

1. Create a new service in the EXISTING Railway project (project ID from env `RAILWAY_WORKSPACE_ID` or use existing project `642e07fa-5c73-41d5-8422-18186e5248b3`)
   - Actually, check if there's already an existing project we should use. Read env vars from `/clawd/bd/freedom-onboarding/.env.local` to find the Railway project ID.
   - Create service name: `freedom-api`
   - Link to GitHub repo: `khwk-kevin/freedom-api`

2. Set environment variables on the service:
   Read ALL env vars from `/clawd/bd/freedom-onboarding/.env.local` and set these on the Railway service:
   - `ANTHROPIC_OAUTH_TOKEN` (copy value from source .env.local)
   - `ANTHROPIC_API_KEY` (copy value from source .env.local)
   - `RAILWAY_API_TOKEN` (copy value)
   - `RAILWAY_TEAM_TOKEN` (copy value)
   - `RAILWAY_REGION` (copy value)
   - `RAILWAY_WORKSPACE_ID` (copy value)
   - `GITHUB_TOKEN` — get from: `cat /root/.openclaw/secrets.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('env/GITHUB_TOKEN',''))"` 
   - `GITHUB_ORG=khwk-kevin`
   - `GITHUB_TEMPLATE_REPO` (copy value from source .env.local)
   - `SUPABASE_URL` (copy value)
   - `SUPABASE_SERVICE_ROLE_KEY` (copy value)
   - `CLOUDFLARE_API_TOKEN` — get from: `cat /root/.openclaw/secrets.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('env/CLOUDFLARE_API_TOKEN',''))"` 
   - `CLOUDFLARE_ZONE_ID` — get from: `cat /root/.openclaw/secrets.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('env/CLOUDFLARE_ZONE_ID',''))"` 
   - `VERCEL_TOKEN` — get from: `cat /root/.openclaw/secrets.json | python3 -c "import sys,json; print(json.load(sys.stdin).get('env/VERCEL_TOKEN',''))"` 
   - `PORT=3000`
   - `NODE_ENV=production`
   - `GOOGLE_PLACES_API_KEY` (copy value from source .env.local)
   - `GEMINI_API_KEY` (copy value from source .env.local)

3. Set start command: `npm run build && npm run start`
   Set region: `asia-southeast1`

4. Assign custom domain: `api.freedom.world`
   Use the `customDomainCreate` mutation (same pattern as in railway.ts `assignCustomDomain`)

### 1.3 Create shared build container service

In the same Railway project, create another service for the shared build container:
- Service name: `build-container`
- Start command: `sleep infinity` (stays alive, we SSH into it)
- Region: `asia-southeast1`
- Env vars: `GITHUB_TOKEN` (same value), `NODE_ENV=development`

After creating it, note the project ID and service ID — these become `BUILD_SERVICE_PROJECT_ID` and `BUILD_SERVICE_ID` env vars on the freedom-api service.

Update the freedom-api service env vars with these two new values.

## Part 2: Wire Frontend to API

### 2.1 Add API URL env var to frontend

Add to `/clawd/bd/freedom-onboarding/.env.local`:
```
NEXT_PUBLIC_API_URL=https://api.freedom.world
```

### 2.2 Update AppBuilderContext.tsx

In `/clawd/bd/freedom-onboarding/context/AppBuilderContext.tsx`, find all `fetch('/api/apps/` calls and replace with:

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

// Before:
fetch('/api/apps/chat', ...)
// After:
fetch(`${API_URL}/apps/chat`, ...)
```

Do this for ALL fetch calls to `/api/apps/*` in the file.

### 2.3 Update any other files with /api/apps/ calls

Search the entire `/clawd/bd/freedom-onboarding/` codebase for `fetch('/api/apps/` or `fetch("/api/apps/` and update them all to use the API_URL prefix.

Also check:
- `components/onboarding/AppBuilderClientPage.tsx`
- `components/onboarding/AppBuilderLayout.tsx`
- `app/iterate/[merchantId]/IterationClientPage.tsx`

### 2.4 Add Cloudflare DNS record for api.freedom.world

Using curl with the Cloudflare API token and zone ID from encrypted secrets, create a CNAME record:
- Name: `api.freedom.world`
- Content: The Railway service domain (get it from Railway after service creation)
- Type: CNAME
- Proxied: false

```bash
CLOUDFLARE_TOKEN=$(python3 -c "import json; print(json.load(open('/root/.openclaw/secrets.json')).get('env/CLOUDFLARE_API_TOKEN',''))")
CLOUDFLARE_ZONE=$(python3 -c "import json; print(json.load(open('/root/.openclaw/secrets.json')).get('env/CLOUDFLARE_ZONE_ID',''))")

curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"CNAME","name":"api.freedom.world","content":"RAILWAY_SERVICE_DOMAIN_HERE","proxied":false,"ttl":1}'
```

### 2.5 Git commit and push frontend changes

```bash
cd /clawd/bd/freedom-onboarding
git add -A
git commit -m "feat: wire frontend to api.freedom.world backend"
git push
```

This triggers Vercel auto-deploy.

## Constraints
- Read env vars from `/clawd/bd/freedom-onboarding/.env.local` for values to copy
- Read secrets from `/root/.openclaw/secrets.json` for tokens not in .env.local
- Use Railway GraphQL API (not CLI) — same pattern as existing railway.ts
- Do NOT delete or modify `/clawd/bd/freedom-api/lib/` or `/clawd/bd/freedom-api/routes/` — only create the deploy script and modify frontend files
- Test the Cloudflare API call works before moving on

## Verification
- Railway services created and running
- `curl https://api.freedom.world/health` returns 200
- Frontend `.env.local` has `NEXT_PUBLIC_API_URL`
- All fetch calls updated
- Git pushed
