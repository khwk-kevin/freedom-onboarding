export type ConversationPhase =
  | 'context_collection'
  | 'class_selection'
  | 'name_selection'
  | 'description_selection'
  | 'inference_confirmation'
  | 'image_generation'
  | 'complete';

export type CommunityClass =
  | 'Personal/Family'
  | 'Company/Local Business'
  | 'Brand'
  | 'Artist/Public Figure/Influencer';

export type CommunityType = 'Public' | 'Private';

export type CommunityCategory =
  | 'Finance/ Investment'
  | 'Parents & Baby'
  | 'Technology'
  | 'Health & Wellness'
  | 'Education'
  | 'Food & Beverages'
  | 'Fashion'
  | 'Gaming'
  | 'Electronic'
  | 'Household & Appliances'
  | 'Beauty & Personal care'
  | 'Sports & Outdoor'
  | 'Automotive'
  | 'Entertainment/ Events'
  | 'Pet'
  | 'Social community'
  | 'Hospitality'
  | 'Travel & Tourism'
  | 'Nightlife'
  | 'Restaurant & Cafe'
  | 'Outdoors Activities'
  | 'Shared Interests & Hobbies'
  | 'Transportation'
  | 'Influencer & Celebrities'
  | 'eCommerce'
  | 'Services'
  | 'Other';

export const ALLOWED_CATEGORIES: CommunityCategory[] = [
  'Finance/ Investment',
  'Parents & Baby',
  'Technology',
  'Health & Wellness',
  'Education',
  'Food & Beverages',
  'Fashion',
  'Gaming',
  'Electronic',
  'Household & Appliances',
  'Beauty & Personal care',
  'Sports & Outdoor',
  'Automotive',
  'Entertainment/ Events',
  'Pet',
  'Social community',
  'Hospitality',
  'Travel & Tourism',
  'Nightlife',
  'Restaurant & Cafe',
  'Outdoors Activities',
  'Shared Interests & Hobbies',
  'Transportation',
  'Influencer & Celebrities',
  'eCommerce',
  'Services',
  'Other',
];

export const DEFAULT_PRIMARY_COLORS: { hex: string; name: string }[] = [
  { hex: '#ffffff', name: 'White' },
  { hex: '#000000', name: 'Black' },
  { hex: '#00FF88', name: 'Freedom Green' },
  { hex: '#10B981', name: 'Emerald' },
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#8B5CF6', name: 'Purple' },
  { hex: '#F59E0B', name: 'Amber' },
  { hex: '#EF4444', name: 'Red' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#14B8A6', name: 'Teal' },
];

export interface CommunityData {
  context?: string;
  communityClass?: CommunityClass;
  name?: string;
  description?: string;
  targetAudience?: string;
  category?: CommunityCategory | string;
  type?: CommunityType;
  logo?: string;
  banner?: string;
  primaryColor?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    showBusinessTypePicker?: boolean;
    // Interactive card types
    cardType?: 'place_confirm' | 'brand_profile' | 'scraping' | 'ai_creating' | 'vibe_select';
    cardData?: Record<string, unknown>;
  };
}

export interface CommunityCreationRequest {
  name: string;
  description: string;
  targetAudience: string;
  category: string;
  type: CommunityType;
  logo: string;
  banner: string;
  primaryColor: string;
}

export interface CommunityCreationResponse {
  success: boolean;
  communityId?: string;
  error?: string;
  errorType?: 'duplicate_name' | 'moderation_failed' | 'validation_error' | 'server_error';
}

export interface ImageGenerationRequest {
  type: 'logo' | 'banner';
  communityData: Partial<CommunityData>;
  prompt?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
  retryCount?: number;
}
