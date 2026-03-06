/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Build a strict Content-Security-Policy
    const csp = [
      "default-src 'self'",
      // Next.js inline scripts + GTM + PostHog CDN
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://app.posthog.com https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline'",
      // Images from supabase storage, vercel blob, and generic HTTPS
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      // API calls: Supabase, PostHog, Google Analytics, Vercel
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://app.posthog.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://*.vercel-insights.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: csp,
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
