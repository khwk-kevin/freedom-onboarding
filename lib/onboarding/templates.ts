export interface BusinessTemplate {
  id: string;
  name: string;
  icon: string;
  sampleName: string;
  primaryColor: string;
  accentColor: string;
  sampleDescription: string;
  sampleProducts: string[];
  sampleRewards: string[];
  previewImage: string;
}

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽️',
    sampleName: 'Your Restaurant',
    primaryColor: '#E84C3D',
    accentColor: '#F5A623',
    sampleDescription: 'Authentic flavors, loyal guests — build your dining community',
    sampleProducts: ['Signature Dish', 'Chef\'s Special', 'Family Set'],
    sampleRewards: ['Free Dessert after 5 visits', '10% off on birthdays'],
    previewImage: '/previews/restaurant.png',
  },
  {
    id: 'cafe',
    name: 'Cafe',
    icon: '☕',
    sampleName: 'Your Cafe',
    primaryColor: '#6B4226',
    accentColor: '#C8956C',
    sampleDescription: 'Where every cup brings your community together',
    sampleProducts: ['Signature Coffee', 'Artisan Pastry', 'Breakfast Set'],
    sampleRewards: ['Free coffee on 10th visit', 'Birthday drink on us'],
    previewImage: '/previews/cafe.png',
  },
  {
    id: 'salon',
    name: 'Salon / Beauty',
    icon: '💅',
    sampleName: 'Your Salon',
    primaryColor: '#D4A5C9',
    accentColor: '#8B5CF6',
    sampleDescription: 'Look good, feel great — your beauty loyalty community',
    sampleProducts: ['Haircut & Style', 'Color Treatment', 'Nail Art'],
    sampleRewards: ['Free treatment after 8 visits', '15% off for members'],
    previewImage: '/previews/salon.png',
  },
  {
    id: 'retail',
    name: 'Retail / Shop',
    icon: '🛍️',
    sampleName: 'Your Shop',
    primaryColor: '#2563EB',
    accentColor: '#10B981',
    sampleDescription: 'Reward your best shoppers, grow your loyal customer base',
    sampleProducts: ['Best Seller', 'New Arrivals', 'Bundle Deal'],
    sampleRewards: ['Points on every purchase', 'VIP early access'],
    previewImage: '/previews/retail.png',
  },
  {
    id: 'fitness',
    name: 'Fitness / Gym',
    icon: '💪',
    sampleName: 'Your Gym',
    primaryColor: '#10F48B',
    accentColor: '#0EA5E9',
    sampleDescription: 'Build your fitness tribe, reward every rep',
    sampleProducts: ['Monthly Membership', 'Personal Training', 'Class Pass'],
    sampleRewards: ['Free session after 20 check-ins', 'Referral bonus'],
    previewImage: '/previews/fitness.png',
  },
  {
    id: 'bar',
    name: 'Bar / Nightlife',
    icon: '🍸',
    sampleName: 'Your Bar',
    primaryColor: '#7C3AED',
    accentColor: '#F59E0B',
    sampleDescription: 'VIP access for your regulars, every night',
    sampleProducts: ['Signature Cocktail', 'Bottle Service', 'Happy Hour'],
    sampleRewards: ['Free drink on 5th visit', 'VIP table priority'],
    previewImage: '/previews/bar.png',
  },
  {
    id: 'clinic',
    name: 'Clinic / Wellness',
    icon: '🌿',
    sampleName: 'Your Clinic',
    primaryColor: '#059669',
    accentColor: '#6EE7B7',
    sampleDescription: 'Care-first community for lasting wellness relationships',
    sampleProducts: ['Consultation', 'Treatment Package', 'Wellness Check'],
    sampleRewards: ['Priority booking for members', 'Package discounts'],
    previewImage: '/previews/clinic.png',
  },
  {
    id: 'community',
    name: 'Online Community',
    icon: '👥',
    sampleName: 'Your Community',
    primaryColor: '#6366F1',
    accentColor: '#818CF8',
    sampleDescription: 'Connect your members, grow your tribe',
    sampleProducts: ['Membership', 'Events', 'Exclusive Content'],
    sampleRewards: ['Founding member perks', 'Event priority access'],
    previewImage: '/previews/community.png',
  },
  {
    id: 'gaming',
    name: 'Games / Entertainment',
    icon: '🎮',
    sampleName: 'Your Gaming Hub',
    primaryColor: '#EF4444',
    accentColor: '#F97316',
    sampleDescription: 'Level up your gaming community',
    sampleProducts: ['Game Credits', 'Tournament Entry', 'Merch'],
    sampleRewards: ['Free game credits', 'Tournament VIP access'],
    previewImage: '/previews/gaming.png',
  },
  {
    id: 'education',
    name: 'Education / Coaching',
    icon: '🎓',
    sampleName: 'Your Academy',
    primaryColor: '#0EA5E9',
    accentColor: '#06B6D4',
    sampleDescription: 'Teach, inspire, and grow your student base',
    sampleProducts: ['Online Course', '1-on-1 Coaching', 'Workshop'],
    sampleRewards: ['Free module unlock', 'Priority booking'],
    previewImage: '/previews/education.png',
  },
  {
    id: 'services',
    name: 'Home Services',
    icon: '🔧',
    sampleName: 'Your Service',
    primaryColor: '#F59E0B',
    accentColor: '#D97706',
    sampleDescription: 'Reliable service, loyal customers',
    sampleProducts: ['Basic Service', 'Premium Package', 'Emergency Call'],
    sampleRewards: ['10% off next booking', 'Priority scheduling'],
    previewImage: '/previews/services.png',
  },
  {
    id: 'other',
    name: 'Other — Describe Your App',
    icon: '💡',
    sampleName: 'Your Business',
    primaryColor: '#6366F1',
    accentColor: '#EC4899',
    sampleDescription: 'Your unique community, your rules',
    sampleProducts: ['Your Product 1', 'Your Product 2', 'Your Service'],
    sampleRewards: ['Loyalty points', 'Member discounts'],
    previewImage: '/previews/other.png',
  },
];

export function getTemplateById(id: string): BusinessTemplate | undefined {
  return BUSINESS_TEMPLATES.find((t) => t.id === id);
}

export function getTemplateByName(name: string): BusinessTemplate | undefined {
  const lower = name.toLowerCase();
  return BUSINESS_TEMPLATES.find(
    (t) => t.id === lower || t.name.toLowerCase() === lower
  );
}
