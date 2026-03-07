import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { merchantId, businessName } = body as { merchantId: string; businessName: string };

  if (!merchantId) {
    return NextResponse.json({ error: 'Missing merchantId' }, { status: 400 });
  }

  // Fetch current merchant notes
  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('notes')
    .eq('id', merchantId)
    .single();

  if (error || !merchant) {
    return NextResponse.json({ error: 'Merchant not found' }, { status: 404 });
  }

  const enrichmentData = {
    type: 'enrichment',
    enriched_at: new Date().toISOString(),
    source: 'manual',
    query: businessName,
    website: null,
    social: {
      facebook: null,
      instagram: null,
      line_oa: null,
      twitter: null,
    },
    google_maps: null,
    industry: null,
    employee_estimate: null,
    recent_news: [],
  };

  // Replace existing enrichment or append
  const existingNotes: Array<Record<string, unknown>> = Array.isArray(merchant.notes)
    ? (merchant.notes as Array<Record<string, unknown>>)
    : [];
  const filteredNotes = existingNotes.filter((n) => n.type !== 'enrichment');
  const newNotes = [...filteredNotes, enrichmentData];

  const { data: updated, error: updateError } = await supabase
    .from('merchants')
    .update({ notes: newNotes })
    .eq('id', merchantId)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ merchant: updated, enrichment: enrichmentData });
}
