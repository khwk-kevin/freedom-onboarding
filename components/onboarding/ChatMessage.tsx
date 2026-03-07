'use client';

import React from 'react';
import type { ChatMessage } from '@/types/onboarding';
import { BUSINESS_TEMPLATES } from '@/lib/onboarding/templates';

interface ChatMessageProps {
  message: ChatMessage & { metadata?: Record<string, unknown> };
  isLatest?: boolean;
  onOptionClick?: (option: string) => void;
  onBusinessTypeSelect?: (typeId: string) => void;
}

// Detect numbered options like "1️⃣ Personal/Family" or "1. Personal/Family"
function extractOptions(text: string): string[] | null {
  const optionPatterns = [
    /^[1-4]️⃣\s+(.+)$/gm,
    /^[1-4]\.\s+(.+)$/gm,
    /^[1-4]\)\s+(.+)$/gm,
  ];

  for (const pattern of optionPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length >= 2) {
      return matches.map(m => m[1].trim());
    }
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
          className="flex flex-col items-center gap-1 px-3 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 hover:border-white/25 text-white transition-all duration-150 active:scale-95"
        >
          <span className="text-2xl leading-none">{template.icon}</span>
          <span className="text-xs font-medium text-center leading-tight">{template.name}</span>
        </button>
      ))}
    </div>
  );
}

// ── User message ──────────────────────────────────────────────────
function UserMessage({ message }: { message: ChatMessage }) {
  // Don't render internal system messages
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
  message,
  isLatest,
  onOptionClick,
  onBusinessTypeSelect,
}: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (isUser) return <UserMessage message={message} />;

  const showBusinessPicker =
    isLatest && Boolean(message.metadata?.showBusinessTypePicker) && Boolean(onBusinessTypeSelect);

  const options = isLatest && !showBusinessPicker ? extractOptions(message.content) : null;

  return (
    <div className="flex items-start space-x-3 max-w-sm">
      {/* AVA avatar */}
      <div
        className="w-8 h-8 rounded-full shrink-0 mt-1 flex items-center justify-center text-xs font-bold border"
        style={{
          background: 'linear-gradient(135deg, #10F48B20, #10F48B40)',
          borderColor: '#10F48B40',
          color: '#10F48B',
        }}
      >
        AVA
      </div>

      <div className="space-y-2 flex-1">
        {/* Message bubble */}
        <div
          className="rounded-2xl rounded-tl-none px-4 py-3 text-sm leading-relaxed"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.10)',
            color: '#F4F4FC',
          }}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Business type picker */}
        {showBusinessPicker && onBusinessTypeSelect && (
          <BusinessTypePicker onSelect={onBusinessTypeSelect} />
        )}

        {/* Option buttons */}
        {options && onOptionClick && (
          <div className="flex flex-wrap gap-2">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onOptionClick(opt)}
                className="px-3 py-1.5 text-xs font-medium rounded-full border transition-all duration-150 active:scale-95"
                style={{
                  borderColor: '#10F48B40',
                  background: '#10F48B10',
                  color: '#F4F4FC',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#10F48B25';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = '#10F48B10';
                }}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────
export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3 max-w-sm">
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
      <div
        className="rounded-2xl rounded-tl-none px-4 py-4 flex items-center space-x-1.5"
        style={{
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.10)',
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
