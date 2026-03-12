import { NextRequest } from 'next/server';
import { z } from 'zod';

const buildAppSchema = z.object({
  merchantId: z.string(),
  onboardingData: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const parsed = buildAppSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.message }), { status: 400 });
  }

  const { merchantId, onboardingData } = parsed.data;
  const businessName = (onboardingData?.name as string) || 'Your App';

  // Build simulation with realistic steps and timing
  // TODO: Replace with real Railway/GitHub pipeline when ready
  // Uses the real deployed template app as the demo preview
  const demoUrl = 'https://fw-template.vercel.app';

  const steps = [
    { event: 'progress', step: 'github', message: 'Creating your app repository...' },
    { event: 'progress', step: 'github_done', message: 'Repository created ✓' },
    { event: 'progress', step: 'railway', message: 'Setting up your app server...' },
    { event: 'progress', step: 'railway_done', message: 'Server provisioned ✓' },
    { event: 'progress', step: 'vault', message: `Writing ${businessName} brand config...` },
    { event: 'progress', step: 'vault_done', message: 'Brand configuration saved ✓' },
    { event: 'progress', step: 'assets', message: 'Uploading logo & images...' },
    { event: 'progress', step: 'building', message: 'AI is building your app...' },
    { event: 'progress', step: 'building', message: 'Generating pages & layouts...' },
    { event: 'progress', step: 'building', message: 'Applying your brand style...' },
    { event: 'progress', step: 'build_done', message: 'Build complete ✓' },
    { event: 'progress', step: 'starting', message: 'Starting your app...' },
    { event: 'complete', step: 'done', message: `${businessName} is live! 🎉`, devUrl: demoUrl, projectId: merchantId },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      for (const step of steps) {
        // Variable delays: faster for checkmarks, slower for "building" steps
        const delay = step.step.includes('done') || step.step === 'starting'
          ? 800
          : step.step === 'building'
            ? 3000
            : 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify(step)}\n\n`)
        );
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
