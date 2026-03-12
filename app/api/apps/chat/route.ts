/**
 * POST /api/apps/chat
 *
 * Simple Anthropic chat endpoint for the App Builder interview pipeline.
 * Uses the APP_BUILDER_SYSTEM_PROMPT (or a caller-supplied systemPrompt).
 *
 * Body:
 *   {
 *     messages: Array<{ role: 'user' | 'assistant'; content: string }>,
 *     systemPrompt?: string,   // defaults to APP_BUILDER_SYSTEM_PROMPT
 *     phase?: 'phase1a' | 'phase1b' | 'review' | 'complete'
 *   }
 *
 * Response: { text: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { APP_BUILDER_SYSTEM_PROMPT } from '@/lib/app-builder/ava-prompt';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_OAUTH_TOKEN || process.env.ANTHROPIC_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  systemPrompt?: string;
  phase?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: ChatRequestBody;

  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { messages, systemPrompt } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: 'messages array is required and must not be empty' },
      { status: 400 }
    );
  }

  // Validate message shapes
  const validMessages = messages.filter(
    (m) =>
      m &&
      typeof m === 'object' &&
      (m.role === 'user' || m.role === 'assistant') &&
      typeof m.content === 'string' &&
      m.content.trim().length > 0
  );

  if (validMessages.length === 0) {
    return NextResponse.json(
      { error: 'No valid messages found' },
      { status: 400 }
    );
  }

  // Ensure the messages array starts with a user message (Anthropic requirement)
  const cleanedMessages: ChatMessage[] = [];
  for (const m of validMessages) {
    const last = cleanedMessages[cleanedMessages.length - 1];
    if (last && last.role === m.role) {
      // Merge consecutive same-role messages
      last.content += '\n' + m.content;
    } else {
      cleanedMessages.push({ role: m.role, content: m.content });
    }
  }

  // Ensure first message is from user (strip leading assistant messages)
  while (cleanedMessages.length > 0 && cleanedMessages[0].role !== 'user') {
    cleanedMessages.shift();
  }
  if (cleanedMessages.length === 0) {
    return NextResponse.json(
      { error: 'No user messages found' },
      { status: 400 }
    );
  }

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      system: systemPrompt ?? APP_BUILDER_SYSTEM_PROMPT,
      messages: cleanedMessages,
    });

    const text =
      response.content
        .filter((block) => block.type === 'text')
        .map((block) => (block as { type: 'text'; text: string }).text)
        .join('') ?? '';

    return NextResponse.json({ text }, { status: 200 });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[apps/chat] Anthropic API error:', error.message);

    return NextResponse.json(
      {
        error: 'AI call failed',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
