import { NextResponse } from 'next/server';
import { generateGreeting } from '@/lib/onboarding/chat-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const greeting = await generateGreeting();
    return NextResponse.json({ success: true, greeting });
  } catch (error) {
    console.error('Greeting error:', error);
    return NextResponse.json({
      success: true,
      greeting:
        "Hey! 👋 I'm AVA, Freedom World's AI Community Consultant — here to help you launch your dream community.\nWhat kind of community are you thinking of building?",
    });
  }
}
