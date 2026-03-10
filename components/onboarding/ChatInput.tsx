'use client';

import React, { useState, useRef } from 'react';
import type { KeyboardEvent } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onUploadImage?: (imageUrl: string, type: 'logo' | 'banner') => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSendMessage, onUploadImage, disabled, placeholder }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmedInput = input.trim();
    if (trimmedInput && !disabled) {
      onSendMessage(trimmedInput);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;
    setUploadError(null);
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      setUploadError('Only PNG and JPG images are allowed');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Image must be 3MB or less');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    try {
      setIsUploading(true);
      const type: 'logo' | 'banner' = file.name.toLowerCase().includes('banner') ? 'banner' : 'logo';
      const formData = new FormData();
      formData.append('image', file);
      formData.append('type', type);
      const res = await fetch('/api/onboarding/upload-image', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.success && result.imageUrl) {
        onUploadImage(result.imageUrl, type);
        onSendMessage(`I've uploaded my ${type}.`);
      } else {
        setUploadError(result.error || 'Failed to upload image');
      }
    } catch (error: any) {
      setUploadError(error.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div
      className="p-4 md:p-6 shrink-0"
      style={{ background: 'var(--oc-bg)', borderTop: '1px solid var(--oc-border)' }}
    >
      <div className="max-w-4xl mx-auto relative group">
        <div
          className="relative flex items-end rounded-2xl shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-[#10F48B]/40"
          style={{
            background: 'var(--oc-input-bg)',
            border: '1px solid var(--oc-border)',
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleFileSelect}
            aria-label="Upload logo or banner image"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            aria-label={isUploading ? 'Uploading image…' : 'Upload logo or banner image'}
            className="p-3 pl-4 transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10F48B] rounded-lg"
            style={{ color: 'var(--oc-text-muted)' }}
            title="Upload image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled || isUploading}
            aria-label="Message input"
            aria-multiline="true"
            className="flex-1 max-h-32 py-4 px-2 bg-transparent text-[15px] focus:outline-none resize-none overflow-hidden disabled:opacity-50"
            style={{ color: 'var(--oc-text)', ['--tw-placeholder-opacity' as any]: 1 }}
            placeholder={placeholder || 'Type your answer here...'}
            rows={1}
          />

          <div className="p-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={disabled || !input.trim() || isUploading}
              aria-label="Send message"
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              style={{ backgroundColor: '#10F48B' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="#050314" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2 px-2">
          <p className="text-xs" style={{ color: 'var(--oc-text-muted)' }}>
            {uploadError ? (
              <span className="text-red-500">{uploadError}</span>
            ) : (
              <>
                <span className="font-medium" style={{ color: '#10F48B' }}>Tip:</span> You can upload your logo or banner using the image button.
              </>
            )}
          </p>
          <div className="flex items-center space-x-2 text-[10px] uppercase tracking-wider font-medium" style={{ color: 'var(--oc-text-muted)' }}>
            <span>Press Enter to send</span>
            <span className="px-1.5 py-0.5 rounded" style={{ border: '1px solid var(--oc-border)', color: 'var(--oc-text-muted)' }}>↵</span>
          </div>
        </div>
      </div>
    </div>
  );
}
