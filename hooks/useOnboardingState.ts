'use client'

import { useEffect, useCallback, useRef } from 'react'

interface OnboardingMessage {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  phase?: string
}

interface OnboardingStateUpdate {
  onboarding_status?: string
  onboarding_data?: Record<string, unknown>
  onboarding_last_phase_at?: string
  onboarding_completed_at?: string
  business_name?: string
  business_type?: string
  business_description?: string
  logo_url?: string
  banner_url?: string
  primary_color?: string
  status?: string
  last_activity_at?: string
}

interface ResumeState {
  merchant: Record<string, unknown>
  conversations: OnboardingMessage[]
  products: unknown[]
  currentPhase: string | null
  hasActiveSession: boolean
  resumeContext: {
    phase: string
    lastMessage: OnboardingMessage | null
    totalMessages: number
    onboardingData: unknown
  } | null
}

const API_BASE = ''

/**
 * useOnboardingState
 * - Loads state from Supabase on mount for session resume
 * - Saves state updates to Supabase after each change
 * - Debounces saves to avoid excessive writes
 */
export function useOnboardingState(merchantId: string | null) {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  /**
   * Load full onboarding state for session resume
   */
  const loadState = useCallback(async (): Promise<ResumeState | null> => {
    if (!merchantId) return null

    try {
      const res = await fetch(
        `${API_BASE}/api/onboarding/resume?merchantId=${encodeURIComponent(merchantId)}`
      )
      if (!res.ok) {
        console.warn('[useOnboardingState] Failed to load state:', res.status)
        return null
      }
      return res.json()
    } catch (err) {
      console.warn('[useOnboardingState] Load error:', err)
      return null
    }
  }, [merchantId])

  /**
   * Save onboarding state update (debounced — waits 800ms before writing)
   */
  const saveState = useCallback(
    (updates: OnboardingStateUpdate) => {
      if (!merchantId) return

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

      saveTimerRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return

        try {
          const res = await fetch(`${API_BASE}/api/onboarding/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ merchantId, updates }),
          })
          if (!res.ok) {
            console.warn('[useOnboardingState] Save failed:', res.status)
          }
        } catch (err) {
          console.warn('[useOnboardingState] Save error:', err)
        }
      }, 800)
    },
    [merchantId]
  )

  /**
   * Save a single conversation message to Supabase
   */
  const saveMessage = useCallback(
    async (message: OnboardingMessage): Promise<void> => {
      if (!merchantId) return

      try {
        // Update the merchant's last_activity_at and phase via the state route
        await saveState({
          last_activity_at: new Date().toISOString(),
        })

        // Post the message through the state PUT endpoint isn't ideal for conversations
        // — the chat API route handles conversation persistence directly.
        // This hook saves merchant-level state only.
        void message // message saving handled by /api/onboarding/chat
      } catch (err) {
        console.warn('[useOnboardingState] saveMessage error:', err)
      }
    },
    [merchantId, saveState]
  )

  /**
   * Advance onboarding phase and persist
   */
  const advancePhase = useCallback(
    (
      newPhase: string,
      phaseData?: Record<string, unknown>,
      merchantFields?: Partial<OnboardingStateUpdate>
    ) => {
      if (!merchantId) return

      const isComplete = newPhase === 'completed'
      saveState({
        onboarding_status: newPhase,
        onboarding_last_phase_at: new Date().toISOString(),
        ...(isComplete
          ? { onboarding_completed_at: new Date().toISOString(), status: 'onboarded' }
          : { status: 'onboarding' }),
        ...(phaseData
          ? {
              onboarding_data: phaseData as Record<string, unknown>,
            }
          : {}),
        ...merchantFields,
      })
    },
    [merchantId, saveState]
  )

  /**
   * Mark onboarding as abandoned
   */
  const markAbandoned = useCallback(() => {
    if (!merchantId) return
    saveState({ onboarding_status: 'abandoned' })
  }, [merchantId, saveState])

  return {
    loadState,
    saveState,
    saveMessage,
    advancePhase,
    markAbandoned,
  }
}
