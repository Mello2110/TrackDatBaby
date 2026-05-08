'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { getUserBabies } from '@/lib/db'
import { getNowLocal } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'
import type { Alarm, BabyProfile } from '@/types'

export function AlarmWatcher() {
  const { user, userData } = useAuth()
  const { t } = useLanguage()
  const [triggeredAlarms, setTriggeredAlarms] = useState<Set<string>>(new Set())
  const [activePopup, setActivePopup] = useState<{ alarm: Alarm; babyName: string } | null>(null)
  const [babies, setBabies] = useState<BabyProfile[]>([])

  const timezone = userData?.settings?.timezone || 'Europe/Berlin'
  const enabledAlarms = userData?.settings?.enabledAlarms || []

  // Load babies periodically or when user changes
  useEffect(() => {
    if (!user) return
    const load = async () => {
      const b = await getUserBabies(user.uid)
      setBabies(b)
    }
    load()
    const interval = setInterval(load, 60000 * 5) // Every 5 mins
    return () => clearInterval(interval)
  }, [user])

  const checkAlarms = useCallback(() => {
    if (!user || babies.length === 0) return

    const nowStr = getNowLocal(timezone) // YYYY-MM-DDTHH:mm
    const [date, currentTime] = nowStr.split('T')
    
    babies.forEach(baby => {
      const alarms = baby.alarms || []
      alarms.forEach(alarm => {
        // Only if enabled for this user
        if (!enabledAlarms.includes(alarm.id)) return

        // If time matches and not already triggered in this minute
        const triggerKey = `${alarm.id}-${date}-${alarm.time}`
        if (alarm.time === currentTime && !triggeredAlarms.has(triggerKey)) {
          setTriggeredAlarms(prev => new Set(prev).add(triggerKey))
          setActivePopup({ alarm, babyName: baby.name })
          
          // Play a subtle sound if possible
          try {
            const audio = new Audio('/alarm-sound.mp3') // Optional asset
            audio.play().catch(() => {})
          } catch (e) {}
        }
      })
    })
  }, [user, babies, enabledAlarms, timezone, triggeredAlarms])

  useEffect(() => {
    const interval = setInterval(checkAlarms, 10000) // Check every 10s
    return () => clearInterval(interval)
  }, [checkAlarms])

  if (!activePopup) return null

  const { alarm, babyName } = activePopup

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-[320px] bg-white dark:bg-[#1A1A1A] rounded-[24px] overflow-hidden shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.5 3.5c1.5 1.5 1.5 1.5 1.5 1.5M7.5 3.5c-1.5 1.5-1.5 1.5-1.5 1.5"/>
            </svg>
          </div>
          
          <h3 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>
            {alarm.label}
          </h3>
          <p className="text-[14px] font-medium mb-4" style={{ color: 'var(--text2)' }}>
            {babyName} • {alarm.time}
          </p>
          
          <div className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-6" 
            style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
            {alarm.type === 'feeding' ? t('baby.dashboard.meals') : alarm.type === 'medication' ? t('settings.medicationReminders') : t('baby.meals.other')}
          </div>

          <button 
            className="btn-primary w-full shadow-lg"
            onClick={() => setActivePopup(null)}
          >
            {t('common.ok') || 'OK'}
          </button>
        </div>
      </div>
    </div>
  )
}
