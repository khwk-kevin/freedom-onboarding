import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({ authToken: process.env.ANTHROPIC_AUTH_TOKEN, defaultHeaders: { 'anthropic-beta': 'oauth-2025-04-20' } });

interface BrandContentRequest {
  businessName: string;
  businessType?: string;
  vibe?: string;
  products?: string[];
  description?: string;
  bio?: string;
  brandStyle?: string;
  audience?: string;
  address?: string;
  types: ('description' | 'rewards' | 'welcomePost' | 'audiencePersona')[];
}

export async function POST(req: NextRequest) {
  try {
    const data: BrandContentRequest = await req.json();
    if (!data.businessName || !data.types?.length) {
      return NextResponse.json({ error: 'businessName and types required' }, { status: 400 });
    }

    const context = `
Business: ${data.businessName}
Type: ${data.businessType || 'business'}
Vibe: ${data.vibe || 'modern'}
Products/Services: ${data.products?.join(', ') || 'various'}
Current Description: ${data.description || data.bio || 'none'}
Brand Style: ${data.brandStyle || 'not specified'}
Target Audience: ${data.audience || 'not specified'}
Location: ${data.address || 'not specified'}
`.trim();

    const sections = data.types.map(t => {
      switch (t) {
        case 'description':
          return `## COMMUNITY_DESCRIPTION
Write a compelling 2-3 sentence community description for this business's Freedom World community page. Make it inviting, specific to their brand, and highlight what members get. Don't be generic — reference their actual products/vibe/style. Write it as if the business owner is speaking to potential community members.`;
        case 'rewards':
          return `## REWARD_IDEAS
Generate exactly 3 creative, personalized loyalty reward ideas for this business. Each should feel unique to THIS business, not generic. Format each as:
- emoji: a single relevant emoji
- title: short reward name (5 words max)  
- description: 1 sentence explaining the reward
- type: "points" | "visits" | "spending" | "referral"
Make them progressively more valuable (easy → medium → premium).`;
        case 'welcomePost':
          return `## WELCOME_POST
Write a warm, on-brand welcome post (3-4 sentences) that this business would share as their first community post. Match their vibe and tone. Include a call-to-action that encourages engagement. Don't use hashtags.`;
        case 'audiencePersona':
          return `## AUDIENCE_PERSONA
Based on this business's type, location, products, and vibe, describe their ideal customer in 2-3 sentences. Include demographics, interests, and what motivates them to engage with this brand. Be specific and insightful.`;
      }
    }).join('\n\n');

    const prompt = `You are a brand strategist helping a local business set up their community on Freedom World (a community engagement platform).

${context}

Generate the following content. Be specific, creative, and on-brand. Never be generic. Every piece should feel like it was crafted specifically for THIS business.

${sections}

Return a JSON object with the requested fields:
{
  ${data.types.includes('description') ? '"description": "the community description",' : ''}
  ${data.types.includes('rewards') ? '"rewards": [{"emoji": "☕", "title": "...", "description": "...", "type": "..."}],' : ''}
  ${data.types.includes('welcomePost') ? '"welcomePost": "the welcome post text",' : ''}
  ${data.types.includes('audiencePersona') ? '"audiencePersona": "the persona description",' : ''}
}

Return ONLY valid JSON.`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[generate-brand-content] Error:', error);
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 });
  }
}
