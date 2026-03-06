import type { CommunityData } from '@/types/onboarding';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent';
const MAX_RETRIES = 3;

export interface ImageGenerationRequest {
  type: 'logo' | 'banner';
  communityData: Partial<CommunityData>;
  prompt?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  retryCount?: number;
}

export async function generateImage(
  request: ImageGenerationRequest,
  retryCount = 0
): Promise<ImageGenerationResponse> {
  const apiKey = process.env.NANO_BANANA_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY;
  console.log('[image-gen] env check — NANO_BANANA:', !!process.env.NANO_BANANA_API_KEY, 'GEMINI:', !!process.env.GEMINI_API_KEY, 'GOOGLE_AI:', !!process.env.GOOGLE_AI_KEY, 'resolved:', !!apiKey);

  if (!apiKey) {
    return {
      success: false,
      error: 'Image generation API key not configured. Please upload an image instead.',
    };
  }

  try {
    const prompt = buildPrompt(request);

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
      }),
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData?.data);

    if (imagePart) {
      const { mimeType, data: base64 } = imagePart.inlineData;
      const imageUrl = `data:${mimeType};base64,${base64}`;
      return { success: true, imageUrl, retryCount };
    }

    throw new Error('No image generated in response');
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`Image gen attempt ${retryCount + 1}/${MAX_RETRIES}:`, err.message);

    if (retryCount < MAX_RETRIES - 1) {
      const delay = Math.pow(2, retryCount) * 1000;
      await new Promise((r) => setTimeout(r, delay));
      return generateImage(request, retryCount + 1);
    }

    return {
      success: false,
      error: `Image generation failed after ${MAX_RETRIES} attempts. Please upload an image instead.`,
      retryCount,
    };
  }
}

function buildPrompt(request: ImageGenerationRequest): string {
  if (request.prompt) return request.prompt;
  return request.type === 'logo'
    ? buildLogoPrompt(request.communityData)
    : buildBannerPrompt(request.communityData);
}

function buildLogoPrompt(data: Partial<CommunityData>): string {
  const name = data.name || 'Community';
  const category = data.category || 'General';
  const description = data.description || '';
  const audience = data.targetAudience || '';

  const sceneMapping: Record<string, string> = {
    'Finance/ Investment': 'Private library with leather-bound investment tomes and antique brass calculators',
    'Parents & Baby': 'Sun-dappled treehouse with hand-carved growth charts and shared storybooks',
    Technology: 'Steampunk laboratory with brass gears turning code wheels and holographic blueprints',
    'Health & Wellness': 'Zen garden with raked sand forming energy meridians and stone balance sculptures',
    Education: "Ancient scholar's study room merging with digital future",
    'Food & Beverages': 'Artisan kitchen with heritage tools and modern precision equipment',
    Fashion: 'Haute couture atelier with fabric cascades and design sketches',
    Gaming: 'Neon-lit arcade meets fantasy realm with pixel art murals',
  };

  const scene =
    (typeof category === 'string' ? sceneMapping[category] : undefined) ||
    'Modern workspace with carefully curated elements';

  return `CREATE A PHOTOREALISTIC LOGO THAT VISUALLY TELLS THE STORY OF: ${description || `A ${category} community bringing together ${audience}`}

SCENE SETTING: ${scene} at golden hour with warm, inviting natural light

KEY ELEMENTS PRESENT: Three symbolic objects representing the community's core values - each telling part of the story through tangible, photographic detail

COMMUNITY NAME INTEGRATION: '${name}' appears as carved lettering in natural materials (wood/stone/metal), organically integrated into the scene environment

PHOTOGRAPHIC EXECUTION: Shot with 50mm macro lens at f/2.8, ISO 100. Composition: Rule of thirds with name at intersection. Depth layers: foreground detail, midground subject, background atmosphere

STYLE REQUIREMENTS: ULTRA-PHOTOREALISTIC. Must look like professional still-life photography with visible texture details, realistic depth of field with accurate bokeh, natural light behavior with authentic shadows. Material authenticity where metal reflects, wood shows grain, glass refracts.

CRITICAL: This is a 1:1 square logo. DO NOT create generic shapes with text. Create a unique photographic composition that embodies this specific community's story. The name should be discovered in the scene, not imposed upon it.`.trim();
}

function buildBannerPrompt(data: Partial<CommunityData>): string {
  const name = data.name || 'Community';
  const category = data.category || 'General';
  const description = data.description || '';
  const audience = data.targetAudience || '';

  const genreMapping: Record<string, { genre: string; location: string; lighting: string; slugline: string }> = {
    'Finance/ Investment': {
      genre: 'Corporate thriller with intellectual noir lighting',
      location: 'After-hours trading floor with glass walls and city lights',
      lighting: 'Single source practicals (desk lamps, screen glow), neon reflections',
      slugline: 'WHERE DATA BECOMES WISDOM',
    },
    Technology: {
      genre: 'Cyberpunk meets lab thriller',
      location: 'Loft workspace with prototype clutter and server room aesthetics',
      lighting: 'LED strips, screen burn, industrial fluorescents with blue tones',
      slugline: 'CODE THE FUTURE TOGETHER',
    },
    'Health & Wellness': {
      genre: 'Peaceful documentary with tranquil drama',
      location: 'Home wellness space at dawn with nature integration',
      lighting: 'Morning light, soft diffusion, breath-like pacing',
      slugline: 'YOUR STRENGTH, OUR SUPPORT',
    },
    Gaming: {
      genre: 'Esports thriller meets underground arcade atmosphere',
      location: 'Battle station setup or LAN party with competitive energy',
      lighting: 'RGB glow, monitor burn, dark room with neon accent lighting',
      slugline: 'PLAY TOGETHER, WIN TOGETHER',
    },
    Fashion: {
      genre: 'High-fashion editorial with cinematic flair',
      location: 'Urban rooftop or minimalist studio with bold visual contrast',
      lighting: 'Dramatic directional light, golden hour, high contrast silhouettes',
      slugline: 'STYLE IS YOUR STORY',
    },
  };

  const genreData = (typeof category === 'string' ? genreMapping[category] : undefined) || {
    genre: 'Documentary realism',
    location: 'Authentic workspace showing community in action',
    lighting: 'Natural available light with atmospheric depth',
    slugline: 'TOGETHER WE THRIVE',
  };

  return `CREATE A CINEMATIC 16:5 BANNER THAT CAPTURES THIS MOMENT: The defining moment that shows ${description || `what this ${category} community creates for ${audience}`}

SCENE: ${genreData.location} with ${genreData.genre} atmosphere

IN SCENE: People engaged in the community's core activity, showing authentic action (not posing). Composition emphasizes collaborative energy and shared purpose.

CINEMATIC TITLE: '${genreData.slugline}' appears as environmental text (neon sign/projection/carved element) naturally integrated into the scene with subtle glow

CINEMATOGRAPHY: Shot on digital cinema with anamorphic widescreen lens at f/2.8. ${genreData.lighting}. Color grade: Cinematic with emotional depth.

ART DIRECTION: Lived-in authenticity with purpose-driven details. Atmosphere: Environmental elements (light beams, atmospheric haze, tactile textures) that create depth and mood.

CRITICAL: This is a 16:5 cinematic banner (1920x600). Must feel like a movie still from this community's story. NOT a stock photo — this should capture a REAL moment of transformation or connection. The slugline is part of the environment, not overlaid text.`.trim();
}
