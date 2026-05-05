'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import { updateUserSettings } from '@/lib/db'
import { logOut } from '@/lib/auth'
import { Topbar, TabBar, ToggleRow } from '@/components/ui'

type Theme = 'light' | 'dark' | 'baby'

const THEMES: { id: Theme; label: string; dots: string[] }[] = [
  { id: 'light', label: 'Light', dots: ['#DDD7CC', '#F5F0E8', '#A85C28'] },
  { id: 'dark',  label: 'Dark',  dots: ['#12100C', '#282018', '#D08848'] },
  { id: 'baby',  label: 'Baby',  dots: ['#EDD8E4', '#FDF6FA', '#B83860'] },
]

export default function SettingsPage() {
  const { user, userData, refreshUserData } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const settings = userData?.settings || {}
  const [rememberMe, setRememberMe] = useState(settings.rememberMe ?? true)
  const [feeding, setFeeding] = useState(settings.notifications?.feeding ?? true)
  const [medication, setMedication] = useState(settings.notifications?.medication ?? false)
  const [push, setPush] = useState(settings.notifications?.push ?? true)
  const [language, setLanguage] = useState(settings.language || 'en')

  async function save() {
    if (!user) return
    await updateUserSettings(user.uid, {
      theme, rememberMe, language,
      notifications: { feeding, medication, push },
    })
    await refreshUserData()
  }

  async function handleLogout() {
    await logOut()
    router.replace('/(auth)/login')
  }

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title="Settings" action={{ label: 'Save', onClick: save }} />

      <div className="scroll-body">
        {/* Theme */}
        <div className="sec-title">Appearance</div>
        <div className="flex gap-2 mb-5">
          {THEMES.map((t) => (
            <div
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="flex-1 rounded-[10px] p-3 text-center cursor-pointer"
              style={{
                background: 'var(--surface)',
                border: theme === t.id ? '2px solid var(--accent)' : '2px solid var(--border2)',
              }}
            >
              <div className="flex justify-center gap-1 mb-2">
                {t.dots.map((c, i) => (
                  <span key={i} className="w-[13px] h-[13px] rounded-full inline-block"
                    style={{ background: c, border: '1px solid rgba(0,0,0,0.12)' }} />
                ))}
              </div>
              <div className="text-[12px] font-bold" style={{ color: 'var(--text2)' }}>{t.label}</div>
            </div>
          ))}
        </div>

        {/* Preferences */}
        <div className="sec-title">Preferences</div>
        <ToggleRow label="Keep me signed in" value={rememberMe} onChange={setRememberMe} />

        <div className="mb-4 mt-4">
          <label className="input-label">Language</label>
          <select className="input-field" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </div>

        {/* Reminders */}
        <div className="sec-title">Reminders</div>
        <ToggleRow label="Feeding reminders" value={feeding} onChange={setFeeding} />
        <ToggleRow label="Medication reminders" value={medication} onChange={setMedication} />
        <ToggleRow label="Push notifications" value={push} onChange={setPush} />

        {/* Data */}
        <div className="sec-title mt-5">Data export</div>
        <button className="btn-ghost mb-3 text-sm">Export as PDF</button>
        <button className="btn-ghost mb-3 text-sm">Export as CSV</button>
        <button className="btn-ghost mb-3 text-sm">Archive entries</button>

        {/* Account */}
        <div className="sec-title">Account</div>
        <button className="btn-ghost mb-3 text-sm" style={{ color: 'var(--text2)' }} onClick={handleLogout}>
          Sign out
        </button>
        <button className="btn-outline text-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          Delete account
        </button>
      </div>

      <TabBar active="settings" />
    </div>
  )
}
