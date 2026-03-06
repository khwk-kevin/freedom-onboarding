'use client';

import { useState } from 'react';
import type { CommunityData } from '@/types/onboarding';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

interface CommunityCreationResult {
  success: boolean;
  communityId?: string;
  landingPageUrl?: string;
  error?: string;
  errorType?: 'duplicate_name' | 'moderation_failed' | 'validation_error' | 'server_error';
}

export function useCommunityCreation() {
  const [isCreating, setIsCreating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateMissingImages = async (
    communityData: Partial<CommunityData>
  ): Promise<{ logo?: string; banner?: string; errors?: string[] }> => {
    const result: { logo?: string; banner?: string; errors?: string[] } = {};
    const errors: string[] = [];

    setIsGeneratingImage(true);

    try {
      // Generate logo if missing
      if (!communityData.logo) {
        const res = await fetch('/api/onboarding/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'logo', communityData }),
        });
        const logoResult = await res.json();
        if (logoResult.success && logoResult.imageUrl) {
          result.logo = logoResult.imageUrl;
        } else {
          errors.push(logoResult.error || 'Failed to generate logo');
        }
      }

      // Generate banner if missing
      if (!communityData.banner) {
        const res = await fetch('/api/onboarding/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'banner', communityData }),
        });
        const bannerResult = await res.json();
        if (bannerResult.success && bannerResult.imageUrl) {
          result.banner = bannerResult.imageUrl;
        } else {
          errors.push(bannerResult.error || 'Failed to generate banner');
        }
      }

      if (errors.length > 0) {
        result.errors = errors;
      }

      return result;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const createNewCommunity = async (
    communityData: Partial<CommunityData>
  ): Promise<CommunityCreationResult> => {
    setIsCreating(true);
    setError(null);

    try {
      // Validate required fields
      if (!communityData.name) throw new Error('Community name is required');
      if (!communityData.description) throw new Error('Description is required');
      if (!communityData.targetAudience) throw new Error('Target audience is required');
      if (!communityData.category) throw new Error('Category is required');
      if (!communityData.type) throw new Error('Community type is required');
      if (!communityData.primaryColor) throw new Error('Primary color is required');

      // Generate missing images
      const generatedImages = await generateMissingImages(communityData);

      const finalLogo = communityData.logo || generatedImages.logo;
      const finalBanner = communityData.banner || generatedImages.banner;

      if (!finalLogo || !finalBanner) {
        const missingAssets = [];
        if (!finalLogo) missingAssets.push('logo');
        if (!finalBanner) missingAssets.push('banner');
        throw new Error(
          `Missing required assets: ${missingAssets.join(', ')}. ${
            generatedImages.errors ? generatedImages.errors.join('. ') : ''
          }`
        );
      }

      const finalCommunityData: Partial<CommunityData> = {
        ...communityData,
        logo: finalLogo,
        banner: finalBanner,
      };

      // Run community creation and landing page generation in parallel
      const [result, landingResult] = await Promise.allSettled([
        fetch('/api/onboarding/create-community', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: communityData.name,
            description: communityData.description,
            targetAudience: communityData.targetAudience,
            category: communityData.category,
            type: communityData.type,
            logo: finalLogo,
            banner: finalBanner,
            primaryColor: communityData.primaryColor,
          }),
        }).then((r) => r.json()),
        fetch('/api/onboarding/generate-landing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ communityData: finalCommunityData }),
        }).then((r) => r.json()),
      ]);

      const communityResult = result.status === 'fulfilled' ? result.value : null;
      if (!communityResult?.success) {
        const err = result.status === 'rejected' ? result.reason?.message : communityResult?.error;
        setError(err || 'Failed to create community');
        return { success: false, error: err, errorType: communityResult?.errorType };
      }

      // Store landing page data in localStorage
      const slug = slugify(communityData.name);
      if (
        landingResult.status === 'fulfilled' &&
        landingResult.value.success &&
        landingResult.value.data
      ) {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('lp_') && k !== `lp_${slug}`) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));

        const { heroBanner: _hb, experienceImage: _ei, materialsImages: _mi, ...textOnly } =
          landingResult.value.data;
        const isBase64 = (s?: string) => !!s?.startsWith('data:');
        try {
          localStorage.setItem(
            `lp_${slug}`,
            JSON.stringify({
              communityName: communityData.name,
              communityDescription: communityData.description,
              logo: isBase64(finalLogo) ? undefined : finalLogo,
              banner: isBase64(finalBanner) ? undefined : finalBanner,
              primaryColor: communityData.primaryColor,
              ...textOnly,
            })
          );
        } catch {
          // Storage unavailable — skip
        }
      }

      const landingPageUrl = `/${slug}/landing`;

      return {
        success: true,
        communityId: communityResult.communityId,
        landingPageUrl,
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create community';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsCreating(false);
    }
  };

  return {
    isCreating,
    isGeneratingImage,
    error,
    createNewCommunity,
    generateMissingImages,
  };
}
