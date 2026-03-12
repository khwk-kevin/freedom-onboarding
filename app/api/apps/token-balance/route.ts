/**
 * GET /api/apps/token-balance?merchantId=xxx
 *
 * Returns the merchant's current token budget state.
 *
 * Response: { balance: number, used: number, limit: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { FREE_TIER_TOKENS } from '@/lib/app-builder/token-budget';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const merchantId = searchParams.get('merchantId');

  if (!merchantId) {
    return NextResponse.json(
      { error: 'merchantId query parameter is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('merchant_apps')
      .select('token_balance, token_used')
      .eq('id', merchantId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Merchant not found — return default free tier allocation
        return NextResponse.json({
          balance: FREE_TIER_TOKENS,
          used: 0,
          limit: FREE_TIER_TOKENS,
        });
      }
      throw error;
    }

    const balance = (data?.token_balance as number) ?? FREE_TIER_TOKENS;
    const used = (data?.token_used as number) ?? 0;

    return NextResponse.json({
      balance,
      used,
      limit: FREE_TIER_TOKENS,
    });
  } catch (err) {
    console.error('[token-balance] error:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve token balance' },
      { status: 500 }
    );
  }
}
