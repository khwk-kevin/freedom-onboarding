import { AppBuilderAdapterProvider } from '@/context/AppBuilderAdapter';
import { OnboardingChat } from '@/components/onboarding/OnboardingChat';

export const metadata = {
  title: 'Build Your App | Freedom World',
  description: 'Build your custom app with AVA, your AI app builder.',
};

export default function OnboardingPage() {
  return (
    <AppBuilderAdapterProvider>
      <OnboardingChat />
    </AppBuilderAdapterProvider>
  );
}
