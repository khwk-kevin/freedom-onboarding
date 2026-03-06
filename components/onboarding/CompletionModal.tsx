'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CommunityData } from '@/types/onboarding';

interface CompletionModalProps {
  isOpen: boolean;
  communityData: CommunityData;
  communityId: string;
  landingPageUrl?: string;
  onClose: () => void;
  onViewCommunity: () => void;
  onOpenLandingPage?: () => void;
}

const TICK_MS = 100;
const TOTAL_TICKS = 120;

const CAROUSEL_SLIDES = [
  {
    header: 'Congratulations',
    sub: 'You have successfully set up your community. This might take up to 5 minutes.',
    text: 'You can manage your entire business through Freedom Console. From posting articles to listing items and managing your payments.',
  },
  {
    header: 'Keep Control Over Your Community',
    sub: 'Create and write articles, publish on your community and bring engagement.',
    text: 'You can create feed posts on your Freedom Console and publish on your community to gain interactions and engagements.',
  },
  {
    header: 'Grow Your Community',
    sub: 'Let your members become your community ambassadors.',
    text: 'You can reward your community members by inviting their friends using your community referral link and organically grow.',
  },
];

function buildTimer(
  progressRef: React.MutableRefObject<number>,
  onTick: (p: number, slide: number | 'final') => void
): ReturnType<typeof setInterval> {
  return setInterval(() => {
    progressRef.current = Math.min(progressRef.current + 100 / TOTAL_TICKS, 100);
    const p = progressRef.current;
    if (p >= 100) {
      onTick(100, 'final');
    } else {
      onTick(p, Math.min(Math.floor((p / 100) * 3), 2));
    }
  }, TICK_MS);
}

export function CompletionModal({
  isOpen,
  communityData,
  communityId,
  landingPageUrl,
  onClose,
}: CompletionModalProps) {
  const [progress, setProgress] = useState(0);
  const [currentSlide, setCurrentSlide] = useState<number | 'final'>(0);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<number>(0);

  const communityUrl = landingPageUrl
    ? `${process.env.NEXT_PUBLIC_APP_URL || ''}${landingPageUrl}`
    : `https://freedom.world/community/${communityId}`;
  const consoleUrl = process.env.NEXT_PUBLIC_REDIRECT_URL || 'https://console.freedom-staging.world/app/home';
  const mobileDeepLink = `freedomworld://community/${communityId}`;

  const stopTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTimerFrom = (fromProgress: number, fromSlide: number | 'final') => {
    stopTimer();
    progressRef.current = fromProgress;
    setProgress(fromProgress);
    setCurrentSlide(fromSlide);
    if (fromSlide === 'final') return;
    intervalRef.current = buildTimer(progressRef, (p, s) => {
      setProgress(p);
      setCurrentSlide(s);
      if (s === 'final') stopTimer();
    });
  };

  useEffect(() => {
    if (!isOpen) {
      stopTimer();
      return;
    }
    startTimerFrom(0, 0);
    return stopTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Generate QR code
  useEffect(() => {
    if (currentSlide === 'final') {
      import('qrcode').then((QRCode) => {
        QRCode.toDataURL(communityUrl, { width: 120, margin: 1 })
          .then(setQrDataUrl)
          .catch(console.error);
      });
    }
  }, [currentSlide, communityUrl]);

  const goToSlide = (index: number) => {
    if (index < 0 || index > 2) return;
    startTimerFrom((index / 3) * 100, index);
  };

  const handleBack = () => {
    const idx = typeof currentSlide === 'number' ? currentSlide : 3;
    if (idx > 0) goToSlide(Math.min(idx - 1, 2));
  };

  const handleForward = () => {
    const idx = typeof currentSlide === 'number' ? currentSlide : 3;
    if (idx < 2) goToSlide(idx + 1);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(communityUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (!isOpen) return null;

  const isCarousel = currentSlide !== 'final';
  const slideIndex = isCarousel ? (currentSlide as number) : 0;
  const indicatorColor = (i: number) =>
    !isCarousel || i <= (currentSlide as number) ? '#4F46E5' : '#00FF88';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 12 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="relative w-full max-w-[600px] mx-4 rounded-2xl overflow-hidden shadow-2xl bg-white"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Nav indicators */}
        <div className="flex gap-1.5 px-5 pt-5 pb-4 bg-gray-900">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              onClick={() => isCarousel && goToSlide(i)}
              className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${isCarousel ? 'cursor-pointer' : ''}`}
              style={{ background: indicatorColor(i) }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {isCarousel ? (
            <motion.div
              key={`slide-${currentSlide}`}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.25 }}
              className="bg-gray-900"
            >
              {/* Text */}
              <div className="px-6 pb-5">
                <h2 className="text-2xl font-bold text-white mb-2">{CAROUSEL_SLIDES[slideIndex].header}</h2>
                <p className="text-sm font-semibold text-white mb-2 leading-snug">{CAROUSEL_SLIDES[slideIndex].sub}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{CAROUSEL_SLIDES[slideIndex].text}</p>
              </div>

              {/* Placeholder image area */}
              <div className="mx-6 mb-5 rounded-2xl overflow-hidden bg-gray-800 h-[200px] flex items-center justify-center">
                <div className="text-center">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: '#00FF8820' }}
                  >
                    <svg className="w-8 h-8" style={{ color: '#00FF88' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 text-sm">{CAROUSEL_SLIDES[slideIndex].header}</p>
                </div>
              </div>

              {/* Nav controls */}
              <div className="flex items-center justify-between px-6 pb-4">
                <button
                  onClick={handleBack}
                  disabled={(currentSlide as number) === 0}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-30 bg-white/10 hover:bg-white/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs text-gray-400">{(currentSlide as number) + 1} / 3</span>
                <button
                  onClick={handleForward}
                  disabled={(currentSlide as number) === 2}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-30 bg-white/10 hover:bg-white/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Progress footer */}
              <div className="px-6 py-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">Creating Your Community</span>
                  <span className="text-sm font-semibold">
                    <span style={{ color: '#00FF88' }}>{Math.round(progress)}%</span>
                    <span className="text-gray-400"> Complete</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: '#00FF88' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'linear', duration: TICK_MS / 1000 }}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="slide-final"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Dark top */}
              <div className="px-6 pb-0 pt-2 bg-gray-900">
                <h2 className="text-2xl font-bold text-white mb-2">Congratulations! 🎉</h2>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">
                  Your community is all set! Open the mobile app to check it out or go to the Freedom
                  console to customize it.
                </p>
              </div>

              {/* Community info banner */}
              <div className="bg-gray-800 w-full py-6 flex items-center justify-center gap-4">
                {communityData.logo && (
                  <img src={communityData.logo} alt="logo" className="w-16 h-16 rounded-xl object-cover" />
                )}
                <div>
                  <p className="text-white font-bold text-lg">{communityData.name}</p>
                  <p className="text-gray-400 text-sm">{communityData.category}</p>
                </div>
              </div>

              {/* White section — QR + share */}
              <div className="bg-white px-6 py-5">
                <div className="flex gap-5 items-start">
                  {/* QR */}
                  <div className="relative shrink-0 p-3">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code" width={120} height={120} />
                    ) : (
                      <div className="w-[120px] h-[120px] bg-gray-100 rounded flex items-center justify-center">
                        <svg className="animate-spin w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Share info */}
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-gray-900 font-bold text-base mb-0.5">Your Community is All Set</h3>
                    <h4 className="text-gray-700 font-semibold text-sm mb-1.5">Share with Link</h4>
                    <p className="text-gray-500 text-xs leading-relaxed mb-3">
                      Copy the link below and send it to your friends. They can click on it to join your
                      community.
                    </p>

                    <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3 border border-gray-200 bg-gray-50">
                      <svg className="w-3 h-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="text-xs text-gray-500 truncate flex-1 min-w-0">{communityUrl}</span>
                      <button onClick={handleCopy} className="shrink-0 transition-colors" title="Copy link">
                        {copied ? (
                          <svg className="w-3 h-3" style={{ color: '#00FF88' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA row */}
              <div className="flex gap-3 bg-white border-t border-gray-100 px-6 py-4">
                <button
                  onClick={() => { window.location.href = mobileDeepLink; }}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Open on mobile app
                </button>
                <button
                  onClick={() => window.open(consoleUrl, '_blank')}
                  className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-900 transition-opacity hover:opacity-90"
                  style={{ background: '#00FF88' }}
                >
                  Open on Console
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
