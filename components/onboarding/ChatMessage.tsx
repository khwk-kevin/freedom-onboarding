'use client';

import React, { useState } from 'react';
import type { ChatMessage } from '@/types/onboarding';
import { BUSINESS_TEMPLATES } from '@/lib/onboarding/templates';
import {
  PlaceConfirmCard,
  BrandProfileCard,
  ScrapingIndicator,
  AICreationCard,
} from './InteractiveCards';

interface ChatMessageProps {
  message: ChatMessage;
  isLatest?: boolean;
  onOptionClick?: (option: string) => void;
  onBusinessTypeSelect?: (typeId: string) => void;
  onCardAction?: (action: string, cardData?: Record<string, unknown>) => void;
}

function isMultiSelect(text: string): boolean {
  const lower = text.toLowerCase();
  return lower.includes('all that apply') || lower.includes('select multiple') || lower.includes('pick all');
}

function extractOptions(text: string): string[] | null {
  const optionPatterns = [
    /^([1-9]️⃣)\s+(.+)$/gm,
    /^([1-9])\.\s+(.+)$/gm,
    /^([1-9])\)\s+(.+)$/gm,
  ];
  for (const pattern of optionPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length >= 2) return matches.map(m => m[2].trim());
  }
  return null;
}

// ── Business Type Picker ──────────────────────────────────────────
function BusinessTypePicker({ onSelect }: { onSelect: (typeId: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2 max-w-xs">
      {BUSINESS_TEMPLATES.map((template) => (
        <button
          key={template.id}
          onClick={() => onSelect(template.id)}
          className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl transition-all duration-150 active:scale-95"
          style={{
            background: 'var(--oc-bubble-bg)',
            border: '1px solid var(--oc-bubble-border)',
            color: 'var(--oc-text)',
          }}
        >
          <span className="text-2xl leading-none">{template.icon}</span>
          <span className="text-xs font-medium text-center leading-tight">{template.name}</span>
        </button>
      ))}
    </div>
  );
}

// ── Multi-Select Options ──────────────────────────────────────────
const NUM_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

function MultiSelectOptions({ options, onConfirm }: { options: string[]; onConfirm: (selected: string[]) => void }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (opt: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {options.map((opt, i) => {
          const isSelected = selected.has(opt);
          return (
            <button
              key={i}
              onClick={() => toggle(opt)}
              className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 active:scale-95"
              style={{
                borderColor: isSelected ? '#10F48B' : 'var(--oc-btn-border)',
                background: isSelected ? 'rgba(16,244,139,0.2)' : 'var(--oc-btn-bg)',
                color: isSelected ? '#10F48B' : 'var(--oc-text)',
                boxShadow: isSelected ? '0 0 8px rgba(16,244,139,0.2)' : 'none',
              }}
            >
              {isSelected ? '✓ ' : `${NUM_EMOJIS[i] || ''} `}{opt}
            </button>
          );
        })}
      </div>
      {selected.size > 0 && (
        <button
          onClick={() => onConfirm(Array.from(selected))}
          className="px-4 py-2 text-xs font-bold rounded-full transition-all duration-150 active:scale-95"
          style={{ background: '#10F48B', color: '#050314' }}
        >
          Confirm ({selected.size}) →
        </button>
      )}
    </div>
  );
}

// ── Single-Select Options ─────────────────────────────────────────
function SingleSelectOptions({ options, onSelect }: { options: string[]; onSelect: (option: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => onSelect(opt)}
          className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 active:scale-95 hover:opacity-80"
          style={{
            borderColor: 'var(--oc-btn-border)',
            background: 'var(--oc-btn-bg)',
            color: 'var(--oc-text)',
          }}
        >
          {NUM_EMOJIS[i] || ''} {opt}
        </button>
      ))}
    </div>
  );
}

// ── User message ──────────────────────────────────────────────────
function UserMessage({ message }: { message: ChatMessage }) {
  if (message.content.startsWith('[[')) return null;
  return (
    <div className="flex flex-col items-end space-y-1">
      <div
        className="rounded-2xl rounded-tr-none px-5 py-3 shadow-lg text-sm leading-relaxed max-w-xs"
        style={{ background: 'linear-gradient(135deg, #10F48B 0%, #0bd977 100%)', color: '#050314' }}
      >
        <p>{message.content}</p>
      </div>
    </div>
  );
}

// ── AVA message ───────────────────────────────────────────────────
export function ChatMessageComponent({
  message, isLatest, onOptionClick, onBusinessTypeSelect, onCardAction,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  if (isUser) return <UserMessage message={message} />;

  const cardType = message.metadata?.cardType;
  const cardData = message.metadata?.cardData as Record<string, unknown> | undefined;

  // ── Render interactive card messages ─────────────────────────
  if (cardType === 'scraping' && cardData) {
    return (
      <div className="flex items-start space-x-3 max-w-sm">
        <AvaAvatar />
        <ScrapingIndicator
          url={cardData.url as string}
          stage={cardData.stage as 'fetching' | 'analyzing' | 'extracting' | 'done'}
        />
      </div>
    );
  }

  if (cardType === 'place_confirm' && cardData && onCardAction) {
    return (
      <div className="flex items-start space-x-3 max-w-sm">
        <AvaAvatar />
        <div className="space-y-2 flex-1">
          {message.content && (
            <div
              className="rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed"
              style={{ background: 'var(--oc-bubble-bg)', border: '1px solid var(--oc-bubble-border)', color: 'var(--oc-text)' }}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          )}
          <PlaceConfirmCard
            name={cardData.name as string}
            address={cardData.address as string | undefined}
            rating={cardData.rating as string | undefined}
            imageUrl={cardData.imageUrl as string | undefined}
            category={cardData.category as string | undefined}
            onConfirm={() => onCardAction('place_confirm', cardData)}
            onReject={() => onCardAction('place_reject', cardData)}
          />
        </div>
      </div>
    );
  }

  if (cardType === 'brand_profile' && cardData && onCardAction) {
    return (
      <div className="flex items-start space-x-3 max-w-sm">
        <AvaAvatar />
        <div className="space-y-2 flex-1">
          {message.content && (
            <div
              className="rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed"
              style={{ background: 'var(--oc-bubble-bg)', border: '1px solid var(--oc-bubble-border)', color: 'var(--oc-text)' }}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          )}
          <BrandProfileCard
            name={cardData.name as string}
            bio={cardData.bio as string | undefined}
            vibe={cardData.vibe as string | undefined}
            products={cardData.products as string[] | undefined}
            category={cardData.category as string | undefined}
            imageUrl={cardData.imageUrl as string | undefined}
            rating={cardData.rating as string | undefined}
            onConfirm={() => onCardAction('brand_confirm', cardData)}
            onTweak={() => onCardAction('brand_tweak', cardData)}
            onStartFresh={() => onCardAction('brand_fresh', cardData)}
          />
        </div>
      </div>
    );
  }

  if (cardType === 'ai_creating' && cardData) {
    return (
      <div className="flex items-start space-x-3 max-w-sm">
        <AvaAvatar />
        <AICreationCard
          type={cardData.type as 'cover' | 'banner'}
          businessName={cardData.businessName as string | undefined}
          vibe={cardData.vibe as string | undefined}
          style={cardData.style as string | undefined}
        />
      </div>
    );
  }

  // ── Regular text messages ────────────────────────────────────
  const showBusinessPicker =
    isLatest && Boolean(message.metadata?.showBusinessTypePicker) && Boolean(onBusinessTypeSelect);
  const options = isLatest && !showBusinessPicker ? extractOptions(message.content) : null;
  const multiSelect = options && isMultiSelect(message.content);

  return (
    <div className="flex items-start space-x-3 max-w-sm">
      <AvaAvatar />
      <div className="space-y-2 flex-1">
        <div
          className="rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed"
          style={{
            background: 'var(--oc-bubble-bg)',
            border: '1px solid var(--oc-bubble-border)',
            color: 'var(--oc-text)',
          }}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {showBusinessPicker && onBusinessTypeSelect && (
          <BusinessTypePicker onSelect={onBusinessTypeSelect} />
        )}

        {options && onOptionClick && (
          multiSelect ? (
            <MultiSelectOptions options={options} onConfirm={(selected) => onOptionClick(selected.join(', '))} />
          ) : (
            <SingleSelectOptions options={options} onSelect={onOptionClick} />
          )
        )}
      </div>
    </div>
  );
}

// ── Reusable AVA avatar ───────────────────────────────────────────
function AvaAvatar() {
  return (
    <div
      className="w-8 h-8 rounded-full shrink-0 mt-1 flex items-center justify-center text-xs font-bold border"
      style={{
        background: 'rgba(16,244,139,0.1)',
        borderColor: 'rgba(16,244,139,0.25)',
        color: '#10F48B',
      }}
    >
      AVA
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────
export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3 max-w-sm">
      <AvaAvatar />
      <div
        className="rounded-2xl rounded-tl-none px-4 py-4 flex items-center space-x-1.5"
        style={{
          background: 'var(--oc-bubble-bg)',
          border: '1px solid var(--oc-bubble-border)',
        }}
      >
        {[0, 160, 320].map((delay) => (
          <div
            key={delay}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ backgroundColor: '#10F48B', animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
