import type { CommunityData } from '@/types/onboarding';

// Extended community data that includes merchant-onboarding-specific fields
interface MerchantCommunityData extends Partial<CommunityData> {
  businessType?: string;
  vibe?: string;
  products?: string[];
  brandStyle?: string;
}

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
  const data = request.communityData as MerchantCommunityData;
  return request.type === 'logo'
    ? buildLogoPrompt(data)
    : buildBannerPrompt(data);
}

function buildLogoPrompt(data: MerchantCommunityData): string {
  const name = data.name || 'My Business';
  const businessType = data.businessType || data.category || 'local business';
  const vibe = data.vibe || 'professional';
  const products = Array.isArray(data.products) && data.products.length
    ? data.products.join(', ')
    : data.description || 'products and services';
  const audience = data.targetAudience || 'local customers';
  const brandStyle = data.brandStyle || 'modern and clean';

  return `Create a modern, professional logo for "${name}" — a ${businessType} business.

Business details:
- Products/services: ${products}
- Target customers: ${audience}
- Brand vibe: ${vibe}
- Visual style preference: ${brandStyle}

Requirements:
- Clean, modern logo design on a solid background
- The business name "${name}" must be clearly readable
- Use colours that match the "${vibe}" aesthetic
- Style: ${brandStyle}
- Square format (1:1 ratio)
- Professional quality, suitable for a mobile app icon

Do NOT include: stock photo elements, realistic scenes, complex backgrounds, multiple fonts. Keep it SIMPLE and ICONIC. The logo should be instantly recognisable and work at small sizes.`.trim();
}

function buildBannerPrompt(data: MerchantCommunityData): string {
  const name = data.name || 'My Business';
  const businessType = data.businessType || data.category || 'local business';
  const vibe = data.vibe || 'professional';
  const products = Array.isArray(data.products) && data.products.length
    ? data.products.join(', ')
    : data.description || 'products and services';
  const audience = data.targetAudience || 'local customers';
  const brandStyle = data.brandStyle || 'modern and clean';
  const description = data.description || '';

  // Add scraped context if available
  const scrapedContext = (data as Record<string, unknown>).scrapedImages
    ? `\nBrand reference: This business has an active online presence. Their bio: "${description}". Capture a similar aesthetic and energy.`
    : '';

  return `Create a community cover page image (2:1 ratio, 1440x690px) for "${name}" — a ${businessType}.

Business context:
- What they offer: ${products}
- Their customers: ${audience}
- Brand personality: ${vibe}
- Visual style: ${brandStyle}${description ? `\n- About: ${description}` : ''}${scrapedContext}

Design brief:
- This is the HERO COVER IMAGE for a loyalty community app (like a Facebook group cover photo)
- Create an atmospheric, immersive visual that makes people FEEL the brand
- NO TEXT, NO WORDS, NO LETTERS — the app overlays the business name separately
- Use photography-style composition: depth of field, warm lighting, natural textures
- Colours and mood should evoke "${vibe}" + "${brandStyle}"
- Wide horizontal format (2:1 panoramic)
- Think: premium, editorial, magazine-quality imagery
- Capture the EXPERIENCE of visiting this ${businessType} — the ambiance, the feeling

Do NOT include: text, words, logos, watermarks, stock photo clichés, clipart, UI elements. Pure visual storytelling only.`.trim();
}
