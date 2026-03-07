// TODO: Add auth check — import { getServerSession } from '@/lib/supabase/auth'; const user = await getServerSession(); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
import { NextRequest, NextResponse } from 'next/server';
import { getMerchantRevenue, getMerchantLTV } from '@/lib/neon/queries';

// GET /api/crm/revenue?orgId=xxx
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId');

  if (!orgId) {
    return NextResponse.json({ error: 'Missing orgId' }, { status: 400 });
  }

  try {
    const [revenue, ltv] = await Promise.all([
      getMerchantRevenue(orgId),
      getMerchantLTV(orgId),
    ]);

    return NextResponse.json({ revenue, ltv });
  } catch (err) {
    console.error('[crm/revenue] error:', err);
    return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 });
  }
}
