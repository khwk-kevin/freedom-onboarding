import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Create Your App | Freedom World',
  description: 'Build your custom app with AVA, your AI app builder.',
};

export default function StartPage() {
  redirect('/build');
}
