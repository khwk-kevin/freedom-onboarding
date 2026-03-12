/**
 * /iterate/[merchantId] — Iteration Mode Entry Point
 * Sprint 5.1 — Console "Edit My App" Iframe
 *
 * Server component: loads the merchant spec from Supabase, then hands off to
 * the client-side IterationClientPage which boots the builder UI in iteration
 * mode (phase='review', free-form chat, full vault context loaded).
 *
 * Mounted from console.freedom.world via:
 *   <iframe src="/iterate/{merchantId}?token={cognito-jwt}" />
 * or navigated to directly.
 */

import { notFound } from 'next/navigation';
import { loadMerchantApp } from '@/lib/app-builder/persistence';
import { IterationClientPage } from './IterationClientPage';

// ── Types ───────────────────────────────────────────────────

interface PageProps {
  params: { merchantId: string };
  searchParams?: { token?: string };
}

// ── Server component ────────────────────────────────────────

export default async function IteratePage({ params }: PageProps) {
  const { merchantId } = params;

  // Load existing spec from Supabase
  const spec = await loadMerchantApp(merchantId);

  if (!spec) {
    notFound();
  }

  // Pass serialisable spec down to the client component
  return <IterationClientPage initialSpec={spec} merchantId={merchantId} />;
}

// ── Page metadata ───────────────────────────────────────────

export const metadata = {
  title: 'Edit your app — Freedom Builder',
  robots: { index: false, follow: false }, // Console page — no SEO
};

// Opt out of static generation; always server-render to get fresh spec
export const dynamic = 'force-dynamic';
