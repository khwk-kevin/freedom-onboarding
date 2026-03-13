import { AppBuilderClientPage } from '@/components/onboarding/AppBuilderClientPage';

export const metadata = {
  title: 'Build Your App | Freedom World',
  description: 'Create your custom app with AVA, your AI app builder.',
};

/**
 * /build — App Builder entry point.
 * Renders the Sprint 3.3 AVA interview → style picker → deploy flow.
 */
export default function BuildPage() {
  return <AppBuilderClientPage />;
}
