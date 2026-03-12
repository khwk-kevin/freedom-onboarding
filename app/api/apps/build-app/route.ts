import { NextRequest } from 'next/server';
import { z } from 'zod';
import { type AppSpec, calculateCompleteness, specToUrlParams } from '@/lib/app-builder/app-spec';

const buildAppSchema = z.object({
  merchantId: z.string(),
  spec: z.record(z.string(), z.unknown()).optional(),
  // Legacy: also accept onboardingData
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

  const { merchantId, spec: rawSpec, onboardingData } = parsed.data;

  // Build the spec — either from the structured spec or from legacy onboardingData
  let appSpec: AppSpec;
  
  if (rawSpec && rawSpec.identity) {
    // New path: structured spec
    appSpec = rawSpec as unknown as AppSpec;
  } else {
    // Legacy path: convert onboardingData to spec
    const data = onboardingData || {};
    appSpec = {
      identity: {
        name: String(data.name || 'Your App'),
        tagline: String(data.description || '').slice(0, 80),
        description: String(data.description || ''),
        type: String(data.businessType || 'other') as AppSpec['identity']['type'],
        category: String(data.businessType || ''),
      },
      brand: {
        primaryColor: String(data.primaryColor || '#10F48B'),
        vibe: (String(data.vibe || 'modern')) as AppSpec['brand']['vibe'],
        logoUrl: data.logo ? String(data.logo) : undefined,
        bannerUrl: data.banner ? String(data.banner) : undefined,
        fontStyle: 'clean',
        backgroundColor: data.backgroundColor ? String(data.backgroundColor) : undefined,
        fontFamily: data.fontFamily ? String(data.fontFamily) : undefined,
        secondaryColor: Array.isArray(data.brandColors) && (data.brandColors as string[])[1]
          ? String((data.brandColors as string[])[1])
          : undefined,
      },
      audience: {
        description: String(data.audiencePersona || ''),
      },
      products: Array.isArray(data.products) 
        ? (data.products as string[]).map(p => {
            const [name, price] = String(p).split(':');
            return { name: name?.trim() || '', price: price?.trim() || '' };
          }).filter(p => p.name)
        : [],
      features: {
        heroFeature: String(data.heroFeature || ''),
        primaryActions: [],
        userFlow: String(data.userFlow || ''),
        differentiator: '',
      },
      content: {
        welcomeMessage: `Welcome to ${data.name || 'our app'}! 🎉`,
        quickActions: [
          { icon: '🛒', label: 'Order', action: 'ordering' },
          { icon: '📅', label: 'Book', action: 'booking' },
          { icon: '📍', label: 'Visit', action: 'contact' },
          { icon: '💬', label: 'Chat', action: 'messaging' },
        ],
        sections: [
          { type: 'products', title: 'Featured', enabled: true },
          { type: 'loyalty', title: 'Rewards', enabled: true },
          { type: 'feed', title: 'Updates', enabled: true },
          { type: 'contact', title: 'Contact', enabled: true },
        ],
      },
      source: {
        scrapedUrl: data.scrapedUrl ? String(data.scrapedUrl) : undefined,
        scrapedImages: Array.isArray(data.scrapedImages) ? data.scrapedImages as string[] : undefined,
      },
      meta: {
        completeness: 0,
        missingFields: [],
        createdAt: new Date().toISOString(),
        merchantId,
      },
    };
  }

  // Calculate completeness
  const { completeness, missingFields } = calculateCompleteness(appSpec);
  appSpec.meta.completeness = completeness;
  appSpec.meta.missingFields = missingFields;

  const businessName = appSpec.identity.name || 'Your App';

  // Build the personalized app URL
  const specParams = specToUrlParams(appSpec);
  const demoUrl = `https://fw-template.vercel.app?${specParams}`;

  // SSE build simulation
  const steps = [
    { event: 'progress', step: 'spec', message: `App spec: ${completeness}% complete (${13 - missingFields.length}/13 fields)` },
    { event: 'progress', step: 'github', message: 'Creating your app repository...' },
    { event: 'progress', step: 'github_done', message: 'Repository created ✓' },
    { event: 'progress', step: 'vault', message: `Writing ${businessName} app spec...` },
    { event: 'progress', step: 'vault_done', message: 'App spec saved ✓' },
    { event: 'progress', step: 'building', message: 'Generating your personalized app...' },
    { event: 'progress', step: 'building', message: 'Building pages from your spec...' },
    { event: 'progress', step: 'building', message: `Applying ${appSpec.brand.vibe} design theme...` },
    { event: 'progress', step: 'build_done', message: 'Build complete ✓' },
    { event: 'progress', step: 'starting', message: 'Deploying to your custom domain...' },
    { event: 'complete', step: 'done', message: `${businessName} is live! 🎉`, devUrl: demoUrl, projectId: merchantId, completeness },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      for (const step of steps) {
        const delay = step.step.includes('done') || step.step === 'starting' || step.step === 'spec'
          ? 600
          : step.step === 'building'
            ? 2500
            : 1500;
        await new Promise((resolve) => setTimeout(resolve, delay));
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(step)}\n\n`));
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
