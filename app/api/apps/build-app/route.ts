import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const buildAppSchema = z.object({
  merchantId: z.string(),
  onboardingData: z.object({
    businessType: z.string(),
    vibe: z.string(),
    name: z.string(),
    products: z.array(z.string()),
    brandStyle: z.string(),
    primaryColor: z.string(),
    description: z.string(),
    audiencePersona: z.string(),
    scrapedUrl: z.string().optional(),
  }),
  demoMode: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { merchantId, onboardingData, demoMode } = buildAppSchema.parse(body);

  if (demoMode) {
    // Demo mode: simulate build process with delays and return demo URL
    const demoUrl = 'https://demo-baan-mae.vercel.app';
    const events = [
      { event: 'github', message: 'Creating your app repository...' },
      { event: 'railway', message: 'Setting up your app server...' },
      { event: 'vault', message: 'Writing your brand configuration...' },
      { event: 'building', message: 'AI is building your app...' },
      { event: 'done', message: 'Your app is live!', devUrl: demoUrl },
    ];

    const stream = new ReadableStream({
      async start(controller) {
        for (const event of events) {
          await new Promise((resolve) => setTimeout(resolve, 5000)); // 5-second delay between events
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify(event)}\n\n`)
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

  // Normal mode: trigger actual build pipeline
  // ... (existing logic)
}
