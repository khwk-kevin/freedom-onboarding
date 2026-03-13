'use client';

/**
 * UIStylePicker — Sprint 1C
 * Interactive card selector for choosing the app's visual style treatment.
 * 5 options: glass, bold, outlined, gradient, neumorphic
 *
 * - Horizontal scroll on mobile, 5-column grid on desktop
 * - Tap to select (highlighted border + checkmark)
 * - Emits to parent via onSelect callback
 * - Each card has a mini visual preview showing the style's treatment
 */

import { motion } from 'framer-motion';
import type { UIStyle } from '@/lib/app-builder/types';

interface StyleOption {
  id: UIStyle;
  emoji: string;
  name: string;
  tagline: string;
  colors: string[];   // mini preview swatch colors
  previewType: 'blurred' | 'solid' | 'outlined' | 'gradient' | 'raised';
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'glass',
    emoji: '🪟',
    name: 'Glass & Blur',
    tagline: 'Frosted, translucent, premium',
    colors: ['rgba(255,255,255,0.4)', 'rgba(124,58,237,0.3)', 'rgba(99,102,241,0.25)'],
    previewType: 'blurred',
  },
  {
    id: 'bold',
    emoji: '💪',
    name: 'Bold Cards',
    tagline: 'Strong, solid, impactful',
    colors: ['#7C3AED', '#6D28D9', '#5B21B6'],
    previewType: 'solid',
  },
  {
    id: 'outlined',
    emoji: '✏️',
    name: 'Outlined & Clean',
    tagline: 'Minimal, airy, professional',
    colors: ['transparent', 'transparent', 'transparent'],
    previewType: 'outlined',
  },
  {
    id: 'gradient',
    emoji: '🌈',
    name: 'Gradient Flow',
    tagline: 'Colorful, dynamic, creative',
    colors: ['#7C3AED', '#6366F1', '#EC4899'],
    previewType: 'gradient',
  },
  {
    id: 'neumorphic',
    emoji: '🫧',
    name: 'Neumorphic Soft',
    tagline: 'Tactile, raised, gentle',
    colors: ['#e0e5ec', '#d4d8de', '#eef0f3'],
    previewType: 'raised',
  },
];

// ── Mini preview visuals per style ────────────────────────────────────────────

function StyleMiniPreview({ option, primaryColor }: { option: StyleOption; primaryColor: string }) {
  const { previewType, colors } = option;

  const miniCards = [
    { w: '100%', h: 28, flex: 1 },
    { w: '60%', h: 20, flex: 0.6 },
    { w: '80%', h: 24, flex: 0.8 },
  ];

  if (previewType === 'blurred') {
    return (
      <div className="flex flex-col gap-1.5 w-full px-1" style={{
        background: `linear-gradient(135deg, ${primaryColor}22 0%, #f0f4ff 100%)`,
        padding: 8,
        borderRadius: 10,
      }}>
        {miniCards.map((card, i) => (
          <div
            key={i}
            style={{
              height: card.h,
              width: card.w,
              borderRadius: 6,
              background: `rgba(255,255,255,${0.5 - i * 0.1})`,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.6)',
            }}
          />
        ))}
      </div>
    );
  }

  if (previewType === 'solid') {
    return (
      <div className="flex flex-col gap-1.5 w-full" style={{ padding: 8, background: '#f9fafb', borderRadius: 10 }}>
        {miniCards.map((card, i) => (
          <div
            key={i}
            style={{
              height: card.h,
              width: card.w,
              borderRadius: 6,
              background: i === 0 ? primaryColor : `${primaryColor}${['33', '22', '11'][i - 1]}`,
              boxShadow: i === 0 ? `0 2px 8px ${primaryColor}50` : undefined,
            }}
          />
        ))}
      </div>
    );
  }

  if (previewType === 'outlined') {
    return (
      <div className="flex flex-col gap-1.5 w-full" style={{ padding: 8, background: '#ffffff', borderRadius: 10 }}>
        {miniCards.map((card, i) => (
          <div
            key={i}
            style={{
              height: card.h,
              width: card.w,
              borderRadius: 6,
              background: 'transparent',
              border: `2px solid ${i === 0 ? primaryColor : '#e5e7eb'}`,
            }}
          />
        ))}
      </div>
    );
  }

  if (previewType === 'gradient') {
    return (
      <div className="flex flex-col gap-1.5 w-full" style={{ padding: 8, background: '#f9fafb', borderRadius: 10 }}>
        {miniCards.map((card, i) => {
          const gradients = [
            `linear-gradient(135deg, ${primaryColor}, #6366F1)`,
            `linear-gradient(135deg, #6366F1, #EC4899)`,
            `linear-gradient(135deg, #EC4899, ${primaryColor})`,
          ];
          return (
            <div
              key={i}
              style={{
                height: card.h,
                width: card.w,
                borderRadius: 6,
                background: gradients[i],
                boxShadow: `0 2px 6px rgba(0,0,0,0.15)`,
              }}
            />
          );
        })}
      </div>
    );
  }

  // raised / neumorphic
  return (
    <div className="flex flex-col gap-1.5 w-full" style={{ padding: 8, background: '#eef0f3', borderRadius: 10 }}>
      {miniCards.map((card, i) => (
        <div
          key={i}
          style={{
            height: card.h,
            width: card.w,
            borderRadius: 6,
            background: '#e8ecf0',
            boxShadow: `3px 3px 6px #c5c8cd, -3px -3px 6px #ffffff`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface UIStylePickerProps {
  value?: UIStyle;
  onSelect: (style: UIStyle) => void;
  primaryColor?: string;
}

export function UIStylePicker({ value, onSelect, primaryColor = '#7C3AED' }: UIStylePickerProps) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/8 p-3 space-y-2">
      <p className="text-[11px] font-medium text-white/40 uppercase tracking-wide px-1">
        Choose your app style
      </p>

      {/* Scrollable card row */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
        {STYLE_OPTIONS.map((option, i) => {
          const isSelected = value === option.id;

          return (
            <motion.button
              key={option.id}
              onClick={() => onSelect(option.id)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06, duration: 0.3 }}
              whileTap={{ scale: 0.95 }}
              className="relative flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl transition-all snap-center"
              style={{
                width: 110,
                background: isSelected
                  ? `linear-gradient(135deg, ${primaryColor}22, ${primaryColor}10)`
                  : 'rgba(255,255,255,0.04)',
                border: isSelected
                  ? `2px solid ${primaryColor}80`
                  : '2px solid rgba(255,255,255,0.08)',
                boxShadow: isSelected
                  ? `0 0 12px ${primaryColor}25`
                  : undefined,
              }}
            >
              {/* Selection checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: primaryColor }}
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}

              {/* Mini preview visual */}
              <StyleMiniPreview option={option} primaryColor={primaryColor} />

              {/* Label + emoji */}
              <div className="text-center space-y-0.5 w-full">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-base">{option.emoji}</span>
                </div>
                <p className="text-white text-[11px] font-semibold leading-tight">{option.name}</p>
                <p className="text-white/40 text-[9px] leading-tight">{option.tagline}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
