import Anthropic from '@anthropic-ai/sdk';
import { generateImage } from './image-gen';
import type { CommunityData } from '@/types/onboarding';

const anthropic = new Anthropic({ authToken: process.env.ANTHROPIC_AUTH_TOKEN, defaultHeaders: { 'anthropic-beta': 'oauth-2025-04-20' } });

export interface LandingPageContent {
  heroHeadline: string;
  heroBanner: string;
  whyJoin: Array<{ title: string; body: string }>;
  experienceTitle: string;
  experienceText: string;
  experienceImage: string;
  materialsImages: [string, string, string];
}

export interface LandingPageGenerateResponse {
  success: boolean;
  data?: LandingPageContent;
  error?: string;
}

export async function generateLandingPageContent(
  communityData: Partial<CommunityData>
): Promise<LandingPageGenerateResponse> {
  try {
    const [copy, heroBannerImg, expImg, mat1, mat2, mat3] = await Promise.all([
      generateLandingCopy(communityData),
      generateImage({ type: 'banner', communityData }),
      generateImage({ type: 'logo', communityData }),
      generateImage({ type: 'logo', communityData }),
      generateImage({ type: 'logo', communityData }),
      generateImage({ type: 'logo', communityData }),
    ]);

    return {
      success: true,
      data: {
        ...copy,
        heroBanner: heroBannerImg.success && heroBannerImg.imageUrl ? heroBannerImg.imageUrl : '',
        experienceImage: expImg.success && expImg.imageUrl ? expImg.imageUrl : '',
        materialsImages: [
          mat1.success && mat1.imageUrl ? mat1.imageUrl : '',
          mat2.success && mat2.imageUrl ? mat2.imageUrl : '',
          mat3.success && mat3.imageUrl ? mat3.imageUrl : '',
        ],
      },
    };
  } catch (error: unknown) {
    const err = error as Error;
    return { success: false, error: err.message };
  }
}

async function generateLandingCopy(
  data: Partial<CommunityData>
): Promise<Omit<LandingPageContent, 'heroBanner' | 'experienceImage' | 'materialsImages'>> {
  const { name, description, category, targetAudience, communityClass, type } = data;

  const prompt = `You are a world-class copywriter creating landing page content for a community on Freedom World.

Community context:
- Name: ${name}
- Description: ${description}
- Category: ${category}
- Target Audience: ${targetAudience}
- Community Class: ${communityClass}
- Type: ${type}

Generate landing page copy. Return ONLY valid JSON with this exact structure:
{
  "heroHeadline": "5-8 word evocative tagline that captures the community's essence",
  "whyJoin": [
    { "title": "3-4 word benefit title", "body": "2-3 sentences on this specific benefit for members" },
    { "title": "3-4 word benefit title", "body": "2-3 sentences on this specific benefit for members" },
    { "title": "3-4 word benefit title", "body": "2-3 sentences on this specific benefit for members" }
  ],
  "experienceTitle": "4-6 words — what members will experience here",
  "experienceText": "2-3 sentences about the community experience. Vivid and specific."
}`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw =
      response.content[0]?.type === 'text' ? response.content[0].text : '{}';

    // Extract JSON
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      heroHeadline: parsed.heroHeadline || `Welcome to ${name}`,
      whyJoin: parsed.whyJoin || [],
      experienceTitle: parsed.experienceTitle || 'Your Community Awaits',
      experienceText: parsed.experienceText || description || '',
    };
  } catch {
    return {
      heroHeadline: `Welcome to ${name || 'Our Community'}`,
      whyJoin: [
        { title: 'Connect & Grow', body: 'Join a vibrant community of like-minded individuals.' },
        { title: 'Share & Learn', body: 'Exchange ideas and knowledge with fellow members.' },
        { title: 'Build Together', body: 'Create something meaningful together.' },
      ],
      experienceTitle: 'Your Community Awaits',
      experienceText: description || 'Join us and be part of something great.',
    };
  }
}
