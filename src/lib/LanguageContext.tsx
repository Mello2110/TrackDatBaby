'use client'
import { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react'
import { en, AppTranslation } from './i18n/en'
import { de } from './i18n/de'

type Language = 'en' | 'de'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
})

import { useAuth } from '@/lib/AuthContext'

const dictionaries: Record<Language, AppTranslation> = { en, de }

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const { userData } = useAuth()

  // Update language if userData changes
  useEffect(() => {
    if (userData?.settings?.language) {
      setLanguage(userData.settings.language as Language)
    }
  }, [userData?.settings?.language])

  // Translation function
  const t = (key: string): string => {
    const dict = dictionaries[language] || dictionaries.en
    const keys = key.split('.')
    let val: any = dict
    for (const k of keys) {
      if (val[k] !== undefined) {
        val = val[k]
      } else {
        return key // Return key if not found
      }
    }
    return typeof val === 'string' ? val : key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
