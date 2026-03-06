import { NextRequest, NextResponse } from 'next/server';
import { processMessage, generateGreeting } from '@/lib/onboarding/chat-engine';
import type { ChatMessage, CommunityData } from '@/types/onboarding';
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/utils/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/onboarding/chat/greeting — fetch the initial greeting
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

// POST /api/onboarding/chat — streaming SSE chat endpoint
export async function POST(req: NextRequest) {
  // Rate limit: 20 chat messages per minute per IP
  const ip = getClientIp(req);
  const rl = rateLimit(`${ip}:onboarding-chat`, { limit: 20, windowMs: 60_000 });
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await req.json();
    const { messages, extractedData } = body as {
      messages: ChatMessage[];
      extractedData?: Partial<CommunityData>;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    // Limit total interactions per session to control Sonnet costs
    // The onboarding flow is ~7 structured steps, so 40 user messages is very generous
    const MAX_USER_MESSAGES = 40;
    const userMessageCount = messages.filter((m) => m.role === 'user').length;
    if (userMessageCount > MAX_USER_MESSAGES) {
      return NextResponse.json(
        {
          error: 'conversation_limit',
          message:
            "You've reached the maximum number of messages for this session. Please click 'Create Community' to finish, or contact our BD team for help.",
        },
        { status: 429 }
      );
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await processMessage(messages, extractedData);

          // Stream the reply text token by token (simulate streaming for now)
          // In production you'd use Anthropic's streaming API
          const words = result.reply.split('');
          const chunkSize = 3;

          for (let i = 0; i < words.length; i += chunkSize) {
            const chunk = words.slice(i, i + chunkSize).join('');
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`
              )
            );
            // Small delay for streaming feel
            await new Promise((r) => setTimeout(r, 8));
          }

          // Send extracted data event
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'data', updatedData: result.updatedData })}\n\n`
            )
          );

          // Send done
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error: unknown) {
          const err = error as Error;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Chat route error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
