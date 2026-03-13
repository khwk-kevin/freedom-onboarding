# Sprint 1A: Extract Backend API to Standalone Railway Service

## Objective
Move all `/api/apps/*` routes from the Next.js Vercel app into a standalone Express service that will run on Railway at `api.freedom.world`.

## Working Directory
Create new directory: `/clawd/bd/freedom-api/`

## Context
The current codebase at `/clawd/bd/freedom-onboarding/` is a Next.js app deployed to Vercel. It contains both frontend pages AND backend API routes under `app/api/apps/*`. We need to extract the backend into its own service because:
- Railway has no 60s timeout (Vercel does)
- Railway supports SSH for Claude Code builds
- Railway supports WebSockets, long-running processes
- Clean separation: Vercel = frontend, Railway = backend

## Tasks

### 1. Initialize Express project
- Create `/clawd/bd/freedom-api/` with `package.json`, `tsconfig.json`
- Dependencies: `express`, `cors`, `@anthropic-ai/sdk`, `@supabase/supabase-js`, `zod`, `dotenv`
- TypeScript strict mode
- Scripts: `dev` (ts-node + nodemon), `build` (tsc), `start` (node dist/)

### 2. Port API routes (convert Next.js route handlers → Express routes)

Source files to port (read each one from the source repo):

| Source (Next.js) | Target (Express) |
|---|---|
| `/clawd/bd/freedom-onboarding/app/api/apps/chat/route.ts` | `routes/chat.ts` |
| `/clawd/bd/freedom-onboarding/app/api/apps/scrape/route.ts` | `routes/scrape.ts` |
| `/clawd/bd/freedom-onboarding/app/api/apps/provision/route.ts` | `routes/provision.ts` |
| `/clawd/bd/freedom-onboarding/app/api/apps/build-app/route.ts` | `routes/build-app.ts` |
| `/clawd/bd/freedom-onboarding/app/api/apps/deploy/route.ts` | `routes/deploy.ts` |
| `/clawd/bd/freedom-onboarding/app/api/apps/build-status/route.ts` | `routes/build-status.ts` |
| `/clawd/bd/freedom-onboarding/app/api/apps/vm-status/route.ts` | `routes/vm-status.ts` |
| `/clawd/bd/freedom-onboarding/app/api/apps/stop-vm/route.ts` | `routes/stop-vm.ts` |
| `/clawd/bd/freedom-onboarding/app/api/apps/start-iteration/route.ts` | `routes/start-iteration.ts` |
| `/clawd/bd/freedom-onboarding/app/api/apps/build/route.ts` | `routes/build.ts` |
| `/clawd/bd/freedom-onboarding/app/api/apps/sync-freedom/route.ts` | `routes/sync-freedom.ts` |
| `/clawd/bd/freedom-onboarding/app/api/apps/token-balance/route.ts` | `routes/token-balance.ts` |

Conversion pattern:
```typescript
// Next.js
export async function POST(req: NextRequest) { ... }

// Express
router.post('/chat', async (req: Request, res: Response) => { ... });
```

### 3. Port lib modules (copy + adapt)

Copy these from `/clawd/bd/freedom-onboarding/lib/app-builder/` to `/clawd/bd/freedom-api/lib/`:

- `railway.ts` — no changes needed
- `github.ts` — no changes needed
- `build-dispatcher.ts` — no changes needed
- `vault-writer.ts` — no changes needed (read the test file too: `vault-writer.test.ts`)
- `deploy.ts` — copy as-is for now
- `app-spec.ts` — no changes needed
- `ava-prompt.ts` — no changes needed
- `extract-spec.ts` — no changes needed
- `types.ts` — no changes needed
- `persistence.ts` — adapt Supabase imports
- `cost-tracker.ts` — no changes needed
- `token-budget.ts` — no changes needed
- `error-handler.ts` — no changes needed
- `scraper-adapter.ts` — no changes needed
- `bridge.ts` — no changes needed
- `iteration.ts` — no changes needed
- `freedom-sync.ts` — no changes needed

Also copy Supabase client helper — check `/clawd/bd/freedom-onboarding/lib/supabase/server.ts`

### 4. Create main server entry point
- `server.ts` — Express app, mounts all routes under `/apps/` prefix
- CORS middleware: allow `*.freedom.world`, `localhost:3000`
- JSON body parser
- Error handling middleware
- Health check endpoint: `GET /health`
- Port from `PORT` env var (default 3000)

### 5. Create Dockerfile
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### 6. Create .env.example
List all env vars needed (from the source .env.local):
- `ANTHROPIC_OAUTH_TOKEN`
- `ANTHROPIC_API_KEY`
- `RAILWAY_API_TOKEN`
- `RAILWAY_TEAM_TOKEN`
- `RAILWAY_REGION`
- `RAILWAY_WORKSPACE_ID`
- `GITHUB_TOKEN`
- `GITHUB_ORG`
- `GITHUB_TEMPLATE_REPO`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PORT`

### 7. Verify it compiles
Run `npx tsc --noEmit` to verify no type errors.

## Constraints
- Do NOT modify the original `/clawd/bd/freedom-onboarding/` files
- Keep the same logic and behavior — this is a port, not a rewrite
- All Supabase client usage should use `@supabase/supabase-js` directly (no SSR helpers)
- Express routes should return the same JSON shapes as the Next.js routes
- SSE endpoints (build-app) should use `res.write()` + `res.flush()` pattern

## Output
A complete, compiling Express project at `/clawd/bd/freedom-api/` ready to deploy to Railway.
