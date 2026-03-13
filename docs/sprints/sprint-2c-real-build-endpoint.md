# Sprint 2C: Wire Real Build Endpoint

## Objective
Replace the fake SSE build simulation in `build-app.ts` with the real build pipeline that provisions, builds with Claude Code, and deploys to Vercel.

## Working Directory
`/clawd/bd/freedom-api/`

## Context
Read these files first:
- `/clawd/bd/freedom-api/routes/build-app.ts` — current fake SSE simulation (needs rewriting)
- `/clawd/bd/freedom-api/lib/build-dispatcher.ts` — build task queue + Claude Code SSH execution
- `/clawd/bd/freedom-api/lib/deploy.ts` — deploy pipeline (rewritten in Sprint 2B to target Vercel + Cloudflare)
- `/clawd/bd/freedom-api/lib/build-service.ts` — shared build container management (created in Sprint 2B)
- `/clawd/bd/freedom-api/lib/vault-writer.ts` — generates vault files from AppSpec
- `/clawd/bd/freedom-api/lib/github.ts` — GitHub repo creation
- `/clawd/bd/freedom-api/lib/railway.ts` — SSH exec into Railway containers
- `/clawd/bd/freedom-api/lib/app-spec.ts` — AppSpec types and helpers
- `/clawd/bd/freedom-api/lib/persistence.ts` — Supabase persistence

## Task: Rewrite `routes/build-app.ts`

The current endpoint fakes a 13-step SSE animation with `setTimeout()` and returns a hardcoded URL. Replace with the REAL pipeline.

**New SSE flow:**

```
POST /apps/build-app
Body: { merchantId: string, spec: AppSpec }
Response: SSE stream

Step 1: PROVISION
  → event: { event: 'progress', step: 'provision_start', message: 'Setting up your app...' }
  → GitHub API: create repo from template (if not exists)
  → event: { event: 'progress', step: 'provision_github', message: 'Repository created ✓' }

Step 2: PREPARE BUILD
  → event: { event: 'progress', step: 'build_prepare', message: 'Preparing build environment...' }
  → SSH into build container: clone merchant repo
  → SSH: npm install
  → event: { event: 'progress', step: 'build_ready', message: 'Build environment ready ✓' }

Step 3: WRITE VAULT
  → event: { event: 'progress', step: 'vault_start', message: 'Writing your app spec...' }
  → Generate vault files from AppSpec (vault-writer.ts)
  → SSH: write each vault file to /workspace/builds/{merchantId}/
  → event: { event: 'progress', step: 'vault_done', message: 'App spec saved ✓' }

Step 4: CLAUDE CODE BUILD
  → event: { event: 'progress', step: 'build_start', message: 'Building your app with AI...' }
  → SSH: run Claude Code with build prompt based on business type
  → Build prompt should reference the vault files + category build skill
  → event: { event: 'progress', step: 'building', message: 'Generating pages...' }
  → (this step takes 2-10 minutes)
  → event: { event: 'progress', step: 'build_done', message: 'App built ✓' }

Step 5: STATIC EXPORT
  → event: { event: 'progress', step: 'export_start', message: 'Creating production build...' }
  → SSH: npm run build (static export)
  → If fails: auto-fix with Claude Code, retry once
  → event: { event: 'progress', step: 'export_done', message: 'Production build complete ✓' }

Step 6: DEPLOY
  → event: { event: 'progress', step: 'deploy_start', message: 'Deploying to your domain...' }
  → SSH: git push (triggers Vercel auto-deploy)
  → Vercel API: create project + assign domain
  → Cloudflare API: create DNS record
  → Poll Vercel deployment status until ready (max 120s)
  → event: { event: 'progress', step: 'deploy_done', message: 'Deployed ✓' }

Step 7: COMPLETE
  → event: { event: 'complete', step: 'done', message: '{name} is live! 🎉',
      devUrl: 'https://{slug}.app.freedom.world',
      appSpec: spec,
      projectId: merchantId,
      completeness: spec.meta.completeness
    }

CLEANUP
  → Remove merchant code from shared build container
  → Non-blocking, fire-and-forget
```

**Error handling:**
- If ANY step fails, send: `{ event: 'error', step: '{current_step}', message: 'user-friendly error', details: 'sanitized details' }`
- Close the SSE stream after error
- Clean up build container on error too

**Timeout:**
- Total endpoint timeout: 15 minutes (Claude Code builds can be slow)
- Per-step timeouts: provision 60s, build prep 120s, vault 30s, Claude Code 600s, export 120s, deploy 120s

**Build prompt for Claude Code:**
```
Read CLAUDE.md. You have context files in context/ and design config in design/theme.json.
Build a complete {businessType} app following the {businessType} build skill in skills/build/.
Use the {uiStyle} design style for all components.
The app must have: {sections from spec}.
Build ALL pages listed in the skill. Use real data from context/business.md.
After building, verify there are no TypeScript errors.
```

## SSE Response Format
Same as current (compatible with existing frontend):
```
data: {"event":"progress","step":"provision_start","message":"Setting up your app..."}\n\n
data: {"event":"progress","step":"build_done","message":"App built ✓"}\n\n
data: {"event":"complete","step":"done","message":"Live!","devUrl":"https://..."}\n\n
data: {"event":"error","step":"build_start","message":"Build failed"}\n\n
```

## Constraints
- Do NOT modify files outside `/clawd/bd/freedom-api/`
- Use existing lib modules — don't duplicate logic
- SSE events must be compatible with the existing frontend consumer (`AppBuilderContext.tsx` in the Vercel app)
- Sanitize all error messages before sending to client (use existing `error-handler.ts`)
- The Claude Code build prompt must reference the correct build skill for the business type
- Clean up the build container even on failure

## Verification
Run `npx tsc --noEmit` from `/clawd/bd/freedom-api/` to verify no type errors.
