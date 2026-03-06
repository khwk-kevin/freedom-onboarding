import type { CommunityData } from '@/types/onboarding';

export interface CommunityCreationRequest {
  name: string;
  description: string;
  targetAudience: string;
  category: string;
  type: 'Public' | 'Private';
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

// In-memory duplicate name store (would be DB in production)
const createdCommunityNames = new Set<string>();

function validateCommunityName(name: string): { valid: boolean; error?: string } {
  if (name.length > 100) {
    return { valid: false, error: 'Community name must be 100 characters or less' };
  }
  const allowedCharsRegex = /^[a-zA-Z\u0E00-\u0E7F&'\-\s]+$/;
  if (!allowedCharsRegex.test(name)) {
    return {
      valid: false,
      error: "Community name can only contain English letters, Thai characters, &, ', -, and spaces",
    };
  }
  return { valid: true };
}

export function getExistingCommunityNames(): string[] {
  return Array.from(createdCommunityNames);
}

export function isDuplicateName(name: string): boolean {
  return createdCommunityNames.has(name.toLowerCase().trim());
}

export async function createCommunity(
  data: CommunityCreationRequest
): Promise<CommunityCreationResponse> {
  try {
    // Validate name
    const nameValidation = validateCommunityName(data.name);
    if (!nameValidation.valid) {
      return { success: false, error: nameValidation.error, errorType: 'validation_error' };
    }

    if (isDuplicateName(data.name)) {
      return {
        success: false,
        error: `A community named "${data.name}" already exists. Please choose a different name.`,
        errorType: 'duplicate_name',
      };
    }

    // Check lengths
    if (data.description.length > 400) {
      return { success: false, error: 'Description must be 400 characters or less', errorType: 'validation_error' };
    }
    if (data.targetAudience.length > 150) {
      return { success: false, error: 'Target audience must be 150 characters or less', errorType: 'validation_error' };
    }

    // TODO: In production, call Freedom World API
    // POST ${process.env.FREEDOM_WORLD_API_URL}/communities
    const mockCommunityId = `comm_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    createdCommunityNames.add(data.name.toLowerCase().trim());

    await new Promise((r) => setTimeout(r, 500));

    return { success: true, communityId: mockCommunityId };
  } catch (error) {
    console.error('Community creation error:', error);
    return {
      success: false,
      error: 'An unexpected error occurred while creating your community. Please try again.',
      errorType: 'server_error',
    };
  }
}

export async function uploadImage(
  file: Buffer,
  mimeType: string,
  type: 'logo' | 'banner'
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(mimeType)) {
      return { success: false, error: 'Only PNG and JPG images are allowed' };
    }
    const maxSize = 3 * 1024 * 1024;
    if (file.length > maxSize) {
      return { success: false, error: 'Image must be 3MB or less' };
    }

    const base64Image = `data:${mimeType};base64,${file.toString('base64')}`;
    await new Promise((r) => setTimeout(r, 200));
    return { success: true, imageUrl: base64Image };
  } catch (error) {
    console.error('Image upload error:', error);
    return { success: false, error: 'Failed to upload image. Please try again.' };
  }
}

export async function generateLandingPageMock(
  communityId: string
): Promise<{ success: boolean; landingPageUrl?: string; error?: string }> {
  await new Promise((r) => setTimeout(r, 500));
  return {
    success: true,
    landingPageUrl: `https://community.freedom-staging.world/${communityId}`,
  };
}
