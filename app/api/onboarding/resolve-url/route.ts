import { NextRequest, NextResponse } from 'next/server';

// Edge Runtime for better network access (Google blocks Node.js serverless IPs)
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Resolve share.google and other short URLs to their final destination
export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url required' }, { status: 400 });
  }

  try {
    let currentUrl = url;
    let businessName = '';
    
    // Follow redirect chain manually
    for (let i = 0; i < 6; i++) {
      const res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });

      const location = res.headers.get('location');
      
      // Check for redirect
      if (location && [301, 302, 303, 307, 308].includes(res.status)) {
        const fullLocation = location.startsWith('/') ? new URL(location, currentUrl).href : location;
        
        // Try to extract business name from redirect URL
        try {
          const parsed = new URL(fullLocation);
          const q = parsed.searchParams.get('q');
          if (q && q.length > 2 && !q.startsWith('http')) {
            businessName = q;
          }
        } catch { /* ignore */ }
        
        currentUrl = fullLocation;
        continue;
      }
      
      // If 200, try to extract from body
      if (res.status === 200 && !businessName) {
        try {
          const parsed = new URL(currentUrl);
          const q = parsed.searchParams.get('q');
          if (q && q.length > 2 && !q.startsWith('http')) {
            businessName = q;
          }
        } catch { /* ignore */ }
      }
      
      break;
    }
    
    // Build a Google Maps search URL from the business name
    const resolvedUrl = businessName
      ? `https://www.google.com/maps/search/${encodeURIComponent(businessName)}`
      : currentUrl;
    
    return NextResponse.json({
      success: true,
      resolvedUrl,
      businessName: businessName || null,
      originalUrl: url,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      resolvedUrl: url,
      error: (err as Error).message,
    });
  }
}
