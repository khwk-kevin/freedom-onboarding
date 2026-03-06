import { OnboardingProvider } from '@/context/OnboardingContext';
import { OnboardingChat } from '@/components/onboarding/OnboardingChat';

export const metadata = {
  title: 'Create Your Community | Freedom World',
  description: 'Set up your Freedom World community with AVA, your AI onboarding assistant.',
};

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingChat />
    </OnboardingProvider>
  );
}
