'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { CommunityData } from '@/types/onboarding';
import { useCommunityCreation } from '@/hooks/useCommunityCreation';
import { CompletionModal } from './CompletionModal';

interface ConfirmationPanelProps {
  communityData: Partial<CommunityData>;
  onUpdateData: (data: Partial<CommunityData>) => void;
  onGenerateImage: (type: 'logo' | 'banner') => Promise<void>;
}

export function ConfirmationPanel({ communityData, onUpdateData, onGenerateImage }: ConfirmationPanelProps) {
  const { isCreating, isGeneratingImage, error, createNewCommunity } = useCommunityCreation();
  const [showModal, setShowModal] = useState(false);
  const [creationResult, setCreationResult] = useState<{
    communityId?: string;
    landingPageUrl?: string;
  }>({});

  const isComplete = Boolean(
    communityData.name &&
      communityData.description &&
      communityData.targetAudience &&
      communityData.category &&
      communityData.type
  );

  const needsLogo = !communityData.logo;
  const needsBanner = !communityData.banner;
  const isFullyReady = isComplete && !needsLogo && !needsBanner;

  const handleSubmit = async () => {
    const result = await createNewCommunity(communityData);
    if (result.success && result.communityId) {
      setCreationResult({ communityId: result.communityId, landingPageUrl: result.landingPageUrl });
      setShowModal(true);
    }
  };

  const handleViewCommunity = () => {
    const redirectUrl = process.env.NEXT_PUBLIC_REDIRECT_URL || 'https://console.freedom-staging.world/app/home';
    window.location.href = redirectUrl;
  };

  const handleOpenLandingPage = () => {
    if (creationResult.landingPageUrl) {
      window.open(creationResult.landingPageUrl, '_blank');
    }
  };

  if (!isComplete) {
    return (
      <div className="text-center text-gray-400 text-sm py-2">
        <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Continue the conversation to complete your community setup
      </div>
    );
  }

  if (!isFullyReady) {
    return (
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-start space-x-3">
          <svg className="w-4 h-4 text-purple-500 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-800 mb-1">
              {needsLogo && needsBanner ? 'Logo & Banner Required' : needsLogo ? 'Logo Required' : 'Banner Required'}
            </h4>
            <p className="text-xs text-gray-500 mb-3">
              Generate or upload your{' '}
              {needsLogo && needsBanner ? 'logo and banner' : needsLogo ? 'logo' : 'banner'} to continue
            </p>
            <div className="flex space-x-2">
              {needsLogo && (
                <button
                  onClick={() => onGenerateImage('logo')}
                  disabled={isGeneratingImage}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Generate Logo
                </button>
              )}
              {needsBanner && (
                <button
                  onClick={() => onGenerateImage('banner')}
                  disabled={isGeneratingImage}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Generate Banner
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#00FF8820' }}>
            <svg className="w-6 h-6" style={{ color: '#00CC6A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Ready to Launch!</h3>
            <p className="text-xs text-gray-500">Your community is ready to go live</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isCreating || isGeneratingImage}
          className="w-full px-6 py-3 font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center space-x-2 text-gray-900"
          style={{ background: 'linear-gradient(135deg, #00FF88, #00CC6A)' }}
        >
          {isCreating ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Creating Community...</span>
            </>
          ) : isGeneratingImage ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Generating Images...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>Create Community</span>
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 text-center mt-3">
          By creating this community, you agree to Freedom World&apos;s Terms of Service
        </p>
      </div>

      {showModal && creationResult.communityId &&
        typeof document !== 'undefined' &&
        createPortal(
          <CompletionModal
            isOpen={showModal}
            communityData={communityData as CommunityData}
            communityId={creationResult.communityId}
            landingPageUrl={creationResult.landingPageUrl}
            onClose={() => setShowModal(false)}
            onViewCommunity={handleViewCommunity}
            onOpenLandingPage={creationResult.landingPageUrl ? handleOpenLandingPage : undefined}
          />,
          document.body
        )}
    </>
  );
}
