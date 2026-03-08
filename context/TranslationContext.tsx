'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Locale = 'en' | 'th'

interface TranslationContextType {
  t: (key: string) => string
  locale: Locale
  setLocale: (locale: Locale) => void
}

const TranslationContext = createContext<TranslationContextType>({
  t: (key) => key,
  locale: 'en',
  setLocale: () => {},
})

export function useTranslation() {
  return useContext(TranslationContext)
}

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [translations, setTranslations] = useState<Record<string, { message: string }>>({})

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof document !== 'undefined') {
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/`
    }
  }

  useEffect(() => {
    // Check cookie for saved locale
    if (typeof document !== 'undefined') {
      const match = document.cookie.split('; ').find(c => c.startsWith('NEXT_LOCALE='))
      if (match) {
        const saved = match.split('=')[1] as Locale
        if (saved === 'en' || saved === 'th') setLocaleState(saved)
      }
    }
  }, [])

  useEffect(() => {
    fetch(`/translations/${locale}.json`)
      .then(r => r.json())
      .then(data => setTranslations(data))
      .catch(() => setTranslations({}))
  }, [locale])

  const t = (key: string) => translations[key]?.message || key

  return (
    <TranslationContext.Provider value={{ t, locale, setLocale }}>
      {children}
    </TranslationContext.Provider>
  )
}
