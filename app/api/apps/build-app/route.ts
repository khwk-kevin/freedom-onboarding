/**
 * POST /api/apps/build-app
 * 
 * Single endpoint that triggers the full app builder pipeline:
 * 1. Create GitHub repo from template
 * 2. Create Railway project + service
 * 3. Write vault files via SSH
 * 4. Run Claude Code to build the app
 * 5. Return dev URL for live preview
 * 
 * Called from the onboarding flow after all data is collected.
 * 
 * Body: { merchantId: string, onboardingData: {...} }
 * Response: SSE stream with progress events
 */

import { NextRequest } from 'next/server';
import { onboardingToSpec } from '@/lib/app-builder/bridge';
import { createMerchantProject, setServiceEnvVars, getServiceDevUrl, waitForServiceReady, sshWriteFile, sshExecCommand } from '@/lib/app-builder/railway';
import { generateVaultFiles } from '@/lib/app-builder/vault-writer';
import { createMerchantRepo } from '@/lib/app-builder/github';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

function sendEvent(controller: ReadableStreamDefaultController, event: string, data: Record<string, unknown>) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ event, ...data })}\n\n`));
}

export async function POST(req: NextRequest) {
  let body: { merchantId: string; onboardingData: Record<string, unknown> };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { merchantId, onboardingData } = body;

  if (!merchantId || !onboardingData) {
    return new Response(JSON.stringify({ error: 'merchantId and onboardingData required' }), { status: 400 });
  }

  // Convert onboarding data to MerchantAppSpec
  const spec = onboardingToSpec(merchantId, onboardingData);

  // Stream progress events back to client
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Step 1: Create GitHub repo
        sendEvent(controller, 'progress', { step: 'github', message: 'Creating your app repository...' });
        
        let repoUrl: string;
        try {
          const repoResult = await createMerchantRepo(merchantId, spec.category || 'restaurant-food');
          repoUrl = repoResult.cloneUrl || repoResult.repoUrl;
          sendEvent(controller, 'progress', { step: 'github_done', message: 'Repository created ✓' });
        } catch (err) {
          console.error('[build-app] GitHub repo creation failed:', err);
          // Continue without GitHub — Railway can still work with the template
          repoUrl = `https://github.com/${process.env.GITHUB_ORG || 'khwk-kevin'}/${process.env.GITHUB_TEMPLATE_REPO || 'freedom-app-template'}`;
          sendEvent(controller, 'progress', { step: 'github_skip', message: 'Using template directly...' });
        }

        // Step 2: Create Railway project + service
        sendEvent(controller, 'progress', { step: 'railway', message: 'Setting up your app server...' });
        
        const { projectId, serviceId } = await createMerchantProject(merchantId);
        sendEvent(controller, 'progress', { step: 'railway_done', message: 'Server created ✓', projectId, serviceId });

        // Step 3: Set environment variables
        sendEvent(controller, 'progress', { step: 'env', message: 'Configuring environment...' });

        const envVars: Record<string, string> = {
          NODE_ENV: 'development',
          PORT: '3000',
          MERCHANT_ID: merchantId,
          NEXT_PUBLIC_MERCHANT_NAME: spec.businessName || 'My Business',
          NEXT_PUBLIC_PRIMARY_COLOR: spec.primaryColor || '#10F48B',
        };

        // Add Freedom API key if available
        if (process.env.FREEDOM_APP_KEY) {
          envVars.FREEDOM_APP_KEY = process.env.FREEDOM_APP_KEY;
        }

        await setServiceEnvVars(serviceId, envVars);
        sendEvent(controller, 'progress', { step: 'env_done', message: 'Environment configured ✓' });

        // Step 4: Wait for service to be ready
        sendEvent(controller, 'progress', { step: 'starting', message: 'Starting your app server...' });
        
        let devUrl: string;
        try {
          devUrl = await getServiceDevUrl(serviceId);
          await waitForServiceReady(serviceId, 120_000); // 2 min timeout
          sendEvent(controller, 'progress', { step: 'ready', message: 'Server is running ✓', devUrl });
        } catch (err) {
          console.error('[build-app] Service not ready:', err);
          devUrl = `https://${serviceId}.railway.app`;
          sendEvent(controller, 'progress', { step: 'ready_timeout', message: 'Server starting (may take a moment)...', devUrl });
        }

        // Step 5: Write vault files via SSH
        sendEvent(controller, 'progress', { step: 'vault', message: 'Writing your brand configuration...' });
        
        const vaultFiles = generateVaultFiles(spec);
        let vaultWritten = 0;
        for (const file of vaultFiles) {
          try {
            await sshWriteFile(projectId, serviceId, file.path, file.content);
            vaultWritten++;
          } catch (err) {
            console.error(`[build-app] Failed to write vault file ${file.path}:`, err);
          }
        }
        sendEvent(controller, 'progress', { 
          step: 'vault_done', 
          message: `Brand config written (${vaultWritten}/${vaultFiles.length} files) ✓` 
        });

        // Step 6: Also write scraped photos as asset references
        if (spec.scrapedData?.photos?.length) {
          sendEvent(controller, 'progress', { step: 'assets', message: 'Setting up your photos...' });
          // Write an assets manifest that Claude Code can reference
          const assetsManifest = spec.scrapedData.photos.map((url, i) => `- photo_${i}: ${url}`).join('\n');
          try {
            await sshWriteFile(projectId, serviceId, '/workspace/context/assets.md', 
              `# Available Photos\n\nThese are real photos from the merchant's business:\n\n${assetsManifest}\n`);
          } catch {
            // Non-fatal
          }
        }

        // Step 7: Run Claude Code to build the app
        sendEvent(controller, 'progress', { step: 'building', message: 'AI is building your app... 🏗️' });
        
        const buildPrompt = [
          'Read CLAUDE.md first.',
          'You have fresh context in context/ and design/theme.json.',
          `This is a ${spec.businessType || 'restaurant'} called "${spec.businessName || 'My Business'}".`,
          'Build the complete homepage with:',
          '- Hero section with the business name and description',
          '- Product/service highlights section',
          '- Contact section with location info',
          '- Mobile-first responsive design',
          '- Use the brand colors from theme.json',
          'Use ONLY real content from the context files. No placeholders.',
        ].join(' ');

        try {
          const buildResult = await sshExecCommand(
            projectId,
            serviceId,
            `cd /workspace && claude -p "${buildPrompt.replace(/"/g, '\\"')}" --dangerously-skip-permissions --max-turns 50`
          );

          if (buildResult.exitCode === 0) {
            sendEvent(controller, 'progress', { step: 'build_done', message: 'App built successfully! ✨' });
          } else {
            console.error('[build-app] Claude Code build had issues:', buildResult.stderr?.slice(0, 500));
            sendEvent(controller, 'progress', { step: 'build_partial', message: 'App built with some notes — checking...' });
          }
        } catch (err) {
          console.error('[build-app] Claude Code execution failed:', err);
          sendEvent(controller, 'progress', { step: 'build_fallback', message: 'Using template as starting point...' });
        }

        // Step 8: Done — send final result
        const appUrl = devUrl || `https://${serviceId}.railway.app`;
        sendEvent(controller, 'complete', {
          step: 'done',
          message: 'Your app is ready! 🎉',
          devUrl: appUrl,
          projectId,
          serviceId,
          slug: spec.slug,
        });

      } catch (err) {
        const error = err instanceof Error ? err.message : String(err);
        console.error('[build-app] Pipeline error:', error);
        sendEvent(controller, 'error', { step: 'error', message: `Build failed: ${error}` });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
