'use client';

import React from 'react';
import type { ChatMessage } from '@/types/onboarding';

interface ChatMessageProps {
  message: ChatMessage;
  isLatest?: boolean;
  onOptionClick?: (option: string) => void;
}

// Detect numbered options like "1️⃣ Personal/Family" or "1. Personal/Family"
function extractOptions(text: string): string[] | null {
  // Match lines starting with emoji numbers or "N." or "N)"
  const optionPatterns = [
    /^[1-4]️⃣\s+(.+)$/gm,        // 1️⃣ Option text
    /^[1-4]\.\s+(.+)$/gm,         // 1. Option text
    /^[1-4]\)\s+(.+)$/gm,         // 1) Option text
  ];

  for (const pattern of optionPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length >= 2) {
      return matches.map(m => m[1].trim());
    }
  }
  return null;
}

export function ChatMessageComponent({ message, isLatest, onOptionClick }: ChatMessageProps) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex flex-col items-end space-y-1">
        <div className="bg-gradient-to-br from-brand-green to-brand-green-dark text-gray-900 rounded-2xl rounded-tr-none px-6 py-4 shadow-lg text-[15px] leading-relaxed max-w-xl border border-green-200/50">
          <p>{message.content}</p>
        </div>
        <span className="text-[10px] text-gray-400 pr-1">Read</span>
      </div>
    );
  }

  const options = isLatest ? extractOptions(message.content) : null;

  return (
    <div className="flex items-start space-x-4 max-w-2xl">
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-1 border border-gray-200 shadow-sm bg-gray-50">
        <img
          src="https://ui-avatars.com/api/?name=AVA&background=f0fdf4&color=00CC6A&size=128&font-size=0.4"
          alt="AVA"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="space-y-2 group">
        <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-6 py-4 shadow-sm text-gray-700 text-[15px] leading-relaxed group-hover:border-gray-300 transition-colors">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {options && onOptionClick && (
          <div className="flex flex-wrap gap-2 pl-1">
            {options.map((opt, i) => (
              <button
                key={i}
                onClick={() => onOptionClick(opt)}
                className="px-4 py-2 text-sm font-medium rounded-full border border-brand-green/40 bg-brand-green/5 text-gray-700 hover:bg-brand-green/20 hover:border-brand-green transition-all duration-150 active:scale-95"
                aria-label={`Select option: ${opt}`}
              >
                {opt}
              </button>
            ))}
          </div>
        )}
        {isLatest && !options && (
          <span className="text-[10px] text-gray-400 pl-1 opacity-0 group-hover:opacity-100 transition-opacity">
            Just now
          </span>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-4 max-w-2xl">
      <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 mt-1 border border-gray-200 shadow-sm bg-gray-50">
        <img
          src="https://ui-avatars.com/api/?name=AVA&background=f0fdf4&color=00CC6A&size=128&font-size=0.4"
          alt="AVA"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-6 py-5 shadow-sm w-20 h-14 flex items-center justify-center space-x-1.5">
        <div
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: '#00FF88', animationDelay: '0ms' }}
        />
        <div
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: '#00FF88', animationDelay: '160ms' }}
        />
        <div
          className="w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: '#00FF88', animationDelay: '320ms' }}
        />
      </div>
    </div>
  );
}
