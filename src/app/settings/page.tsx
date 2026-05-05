'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import { updateUserSettings } from '@/lib/db'
import { logOut } from '@/lib/auth'
import { Topbar, TabBar, ToggleRow } from '@/components/ui'

import { useLanguage } from '@/lib/LanguageContext'

type Theme = 'light' | 'dark' | 'baby'

export default function SettingsPage() {
  const { user, userData, refreshUserData } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const router = useRouter()

  const settings = userData?.settings || {}
  const [rememberMe, setRememberMe] = useState(settings.rememberMe ?? true)
  const [feeding, setFeeding] = useState(settings.notifications?.feeding ?? true)
  const [medication, setMedication] = useState(settings.notifications?.medication ?? false)
  const [push, setPush] = useState(settings.notifications?.push ?? true)
  const [language, setLanguage] = useState(settings.language || 'en')

  const THEMES: { id: Theme; label: string; dots: string[] }[] = [
    { id: 'light', label: t('settings.light'), dots: ['#DDD7CC', '#F5F0E8', '#A85C28'] },
    { id: 'dark',  label: t('settings.dark'),  dots: ['#12100C', '#282018', '#D08848'] },
    { id: 'baby',  label: t('settings.baby'),  dots: ['#EDD8E4', '#FDF6FA', '#B83860'] },
  ]

  async function save() {
    if (!user) return
    await updateUserSettings(user.uid, {
      theme, rememberMe, language,
      notifications: { feeding, medication, push },
    })
    await refreshUserData()
    router.push('/dashboard')
  }

  async function handleLogout() {
    await logOut()
    router.replace('/login')
  }

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('settings.title')} action={{ label: t('common.save'), onClick: save }} />

      <div className="scroll-body">
        {/* Theme */}
        <div className="sec-title">{t('settings.appearance')}</div>
        <div className="flex gap-2 mb-5">
          {THEMES.map((th) => (
            <div
              key={th.id}
              onClick={() => setTheme(th.id)}
              className="flex-1 rounded-[10px] p-3 text-center cursor-pointer"
              style={{
                background: 'var(--surface)',
                border: theme === th.id ? '2px solid var(--accent)' : '2px solid var(--border2)',
              }}
            >
              <div className="flex justify-center gap-1 mb-2">
                {th.dots.map((c, i) => (
                  <span key={i} className="w-[13px] h-[13px] rounded-full inline-block"
                    style={{ background: c, border: '1px solid rgba(0,0,0,0.12)' }} />
                ))}
              </div>
              <div className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>{th.label}</div>
            </div>
          ))}
        </div>

        {/* Preferences */}
        <div className="sec-title">{t('settings.preferences')}</div>
        <ToggleRow label={t('settings.keepSignedIn')} value={rememberMe} onChange={setRememberMe} />

        <div className="mb-4 mt-4">
          <label className="input-label">{t('settings.language')}</label>
          <select className="input-field" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        {/* Reminders */}
        <div className="sec-title">{t('settings.reminders')}</div>
        <ToggleRow label={t('settings.feedingReminders')} value={feeding} onChange={setFeeding} />
        <ToggleRow label={t('settings.medicationReminders')} value={medication} onChange={setMedication} />
        <ToggleRow label={t('settings.pushNotifications')} value={push} onChange={setPush} />

        {/* Data */}
        <div className="sec-title mt-5">{t('settings.dataExport')}</div>
        <button className="btn-ghost mb-3 text-sm">{t('settings.exportPdf')}</button>
        <button className="btn-ghost mb-3 text-sm">{t('settings.exportCsv')}</button>
        <button className="btn-ghost mb-3 text-sm">{t('settings.archive')}</button>

        {/* Account */}
        <div className="sec-title">{t('settings.account')}</div>
        <button className="btn-ghost mb-3 text-sm" style={{ color: 'var(--text2)' }} onClick={handleLogout}>
          {t('settings.signOut')}
        </button>
        <button className="btn-outline text-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          {t('settings.deleteAccount')}
        </button>
      </div>

      <TabBar active="settings" />
    </div>
  )
}
