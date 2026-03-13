'use client';

/**
 * PhoneFrame — Sprint 1C
 * iPhone-style phone frame with:
 *   - Dynamic Island notch + status bar
 *   - Glow pulse animation on spec updates
 *   - Entrance animation (scale + blur dissolve)
 *   - Side buttons (visual only)
 *   - Scrollable content area
 */

import { motion, useAnimation } from 'framer-motion';
import { useEffect, useRef, type ReactNode } from 'react';

interface PhoneFrameProps {
  /** Brand accent color — drives the glow effect */
  primaryColor?: string;
  /** Increment this counter when spec data changes to trigger glow pulse */
  glowVersion?: number;
  /** Content to render inside the phone screen */
  children: ReactNode;
  /** Extra className on the outer wrapper */
  className?: string;
}

// ── Tiny inline status-bar icons ────────────────────────────────────────────

function SignalBars() {
  return (
    <svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" className="text-black">
      <rect x="0" y="6" width="3" height="6" rx="0.5" opacity="0.4" />
      <rect x="4" y="4" width="3" height="8" rx="0.5" opacity="0.6" />
      <rect x="8" y="2" width="3" height="10" rx="0.5" opacity="0.8" />
      <rect x="12" y="0" width="3" height="12" rx="0.5" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none" className="text-black">
      <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" fill="currentColor" />
      <path d="M3.5 6.5A6.5 6.5 0 0 1 8 4.5a6.5 6.5 0 0 1 4.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M1 3.5A10 10 0 0 1 8 1a10 10 0 0 1 7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.5" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <svg width="25" height="12" viewBox="0 0 25 12" fill="none" className="text-black">
      <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeWidth="1" />
      <rect x="22.5" y="3.5" width="2" height="5" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="2" y="2" width="16" height="8" rx="2" fill="currentColor" />
    </svg>
  );
}

// ── Main PhoneFrame ──────────────────────────────────────────────────────────

export function PhoneFrame({
  primaryColor = '#7C3AED',
  glowVersion = 0,
  children,
  className = '',
}: PhoneFrameProps) {
  const glowControls = useAnimation();
  const isFirstMount = useRef(true);

  // Pulse glow when glowVersion changes (but not on initial mount)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const r = parseInt(primaryColor.slice(1, 3), 16) || 124;
    const g = parseInt(primaryColor.slice(3, 5), 16) || 58;
    const b = parseInt(primaryColor.slice(5, 7), 16) || 237;

    glowControls.start({
      boxShadow: [
        `0 0 0px 0px rgba(${r},${g},${b},0)`,
        `0 0 30px 12px rgba(${r},${g},${b},0.45), 0 0 60px 24px rgba(${r},${g},${b},0.2)`,
        `0 0 10px 4px rgba(${r},${g},${b},0.15)`,
      ],
      transition: { duration: 0.8, ease: 'easeOut' },
    });
  }, [glowVersion, primaryColor, glowControls]);

  // Idle ambient glow
  const ambientGlow = `0 0 20px 6px rgba(${parseInt(primaryColor.slice(1,3),16)||124},${parseInt(primaryColor.slice(3,5),16)||58},${parseInt(primaryColor.slice(5,7),16)||237},0.12)`;

  return (
    <motion.div
      initial={{ scale: 0.82, opacity: 0, filter: 'blur(18px)' }}
      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`relative mx-auto select-none ${className}`}
      style={{ width: 340, maxWidth: '100%' }}
    >
      {/* Ambient glow aura behind phone */}
      <motion.div
        className="absolute inset-[-20px] rounded-[60px] pointer-events-none"
        animate={glowControls}
        initial={{ boxShadow: ambientGlow }}
        style={{ boxShadow: ambientGlow }}
      />

      {/* Phone outer shell — titanium-style dark frame */}
      <div
        className="relative rounded-[50px]"
        style={{
          background: 'linear-gradient(145deg, #3a3a3c 0%, #1c1c1e 40%, #0a0a0c 100%)',
          padding: '11px',
          boxShadow: [
            '0 0 0 1px rgba(255,255,255,0.09)',
            'inset 0 0 0 1px rgba(0,0,0,0.9)',
            '0 40px 80px rgba(0,0,0,0.6)',
            '0 20px 40px rgba(0,0,0,0.4)',
          ].join(', '),
        }}
      >
        {/* Volume buttons (left) */}
        <div className="absolute left-[-3px] top-[108px] w-[3px] h-[28px] rounded-r-sm" style={{ background: 'linear-gradient(90deg, #2a2a2c, #3a3a3c)' }} />
        <div className="absolute left-[-3px] top-[148px] w-[3px] h-[56px] rounded-r-sm" style={{ background: 'linear-gradient(90deg, #2a2a2c, #3a3a3c)' }} />
        <div className="absolute left-[-3px] top-[216px] w-[3px] h-[56px] rounded-r-sm" style={{ background: 'linear-gradient(90deg, #2a2a2c, #3a3a3c)' }} />
        {/* Power button (right) */}
        <div className="absolute right-[-3px] top-[160px] w-[3px] h-[72px] rounded-l-sm" style={{ background: 'linear-gradient(270deg, #2a2a2c, #3a3a3c)' }} />

        {/* Inner screen — slightly inset rounded rect */}
        <div
          className="overflow-hidden bg-black"
          style={{
            borderRadius: '40px',
            height: '680px',
          }}
        >
          {/* Screen glass surface */}
          <div className="relative w-full h-full bg-white overflow-hidden">
            {/* Dynamic Island */}
            <div
              className="absolute top-[10px] left-1/2 -translate-x-1/2 z-50 bg-black flex items-center justify-center gap-1.5"
              style={{ width: 120, height: 36, borderRadius: 20 }}
            >
              {/* Front camera dot */}
              <div className="w-3 h-3 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(50,100,200,0.6)' }} />
              </div>
              {/* FaceID sensor pill */}
              <div className="w-4 h-2 rounded-full bg-[#1c1c1c]" style={{ boxShadow: 'inset 0 0 2px rgba(0,0,0,0.8)' }} />
            </div>

            {/* Status bar */}
            <div
              className="absolute top-0 left-0 right-0 z-40 flex items-end justify-between px-7 pb-1"
              style={{ height: 54 }}
            >
              <span className="text-black text-[13px] font-semibold tracking-tight">9:41</span>
              <div className="flex items-center gap-[5px]">
                <SignalBars />
                <WifiIcon />
                <BatteryIcon />
              </div>
            </div>

            {/* Scrollable app content */}
            <div
              className="absolute inset-0 overflow-y-auto overscroll-contain"
              style={{ paddingTop: 54, paddingBottom: 80 }}
            >
              {children}
            </div>

            {/* Bottom home indicator */}
            <div
              className="absolute bottom-[8px] left-1/2 -translate-x-1/2 z-50"
              style={{
                width: 130,
                height: 5,
                borderRadius: 3,
                background: 'rgba(0,0,0,0.25)',
              }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
