/**
 * /start — App Builder onboarding page
 * Sprint 3.3 — End-to-End Interview Pipeline
 *
 * Renders the split-screen app builder:
 *   left  → AVA chat (interview)
 *   right → LivePreview (iframe to Railway dev server)
 *
 * Signup wall appears as a modal when showSignupWall=true.
 * Color picker inline in chat at Q4.
 */

import { AppBuilderClientPage } from '@/components/onboarding/AppBuilderClientPage';

export const metadata = {
  title: 'Build Your App | Freedom World',
  description: 'Build a live, custom app for your business in minutes with AVA.',
};

export default function StartPage() {
  return <AppBuilderClientPage />;
}
