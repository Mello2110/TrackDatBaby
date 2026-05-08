'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { useTheme } from '@/lib/ThemeContext'
import { updateUserSettings } from '@/lib/db'
import { logOut } from '@/lib/auth'
import { deleteUser } from 'firebase/auth'
import { Topbar, TabBar, ToggleRow } from '@/components/ui'

import { useLanguage } from '@/lib/LanguageContext'
import type { UserSettings } from '@/types'
import { messaging } from '@/lib/firebase'
import { getToken } from 'firebase/messaging'
import { saveFCMToken } from '@/lib/db'

const VAPID_KEY = "BN2DCRNIc3EPq53WWf4aGUDAztBpITlHqzmsLinjFwXxIFRWSfC1ZzqlRsfFpFkUVBC7jVMfI5YAlb7MpOy1I3c"

type Theme = 'light' | 'dark' | 'baby'

export default function SettingsPage() {
  const { user, userData, refreshUserData } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')

  const settings: Partial<UserSettings> = userData?.settings || {}
  const [rememberMe, setRememberMe] = useState(settings.rememberMe ?? true)
  const [feeding, setFeeding] = useState(settings.notifications?.feeding ?? true)
  const [medication, setMedication] = useState(settings.notifications?.medication ?? false)
  const [push, setPush] = useState(settings.notifications?.push ?? true)
  const [language, setLanguage] = useState(settings.language || 'en')
  const [timezone, setTimezone] = useState(settings.timezone || 'Europe/Berlin')

  const THEMES: { id: Theme; label: string; dots: string[] }[] = [
    { id: 'light', label: t('settings.light'), dots: ['#DDD7CC', '#F5F0E8', '#A85C28'] },
    { id: 'dark',  label: t('settings.dark'),  dots: ['#12100C', '#fcdec0ff', '#D08848'] },
    { id: 'baby',  label: t('settings.baby'),  dots: ['#EDD8E4', '#FDF6FA', '#B83860'] },
  ]

  const [saving, setSaving] = useState(false)

  async function save() {
    if (!user) return
    setSaving(true)
    setError('')
    
    console.log('Starting save process...')

    // Request push permissions if toggled on
    if (push) {
      try {
        console.log('Push enabled, checking browser support...')
        if (!('Notification' in window)) {
          throw new Error('This browser does not support notifications.')
        }

        console.log('Current permission state:', Notification.permission)
        
        // If already denied, tell the user they need to reset it
        if (Notification.permission === 'denied') {
          setError(t('settings.pushDenied') || 'Push permissions are blocked. Please reset them in your browser settings.')
          // We continue saving other settings
        }

        const permission = await Notification.requestPermission()
        console.log('Permission result:', permission)

        if (permission === 'granted') {
          const m = await messaging()
          if (m) {
            console.log('Firebase messaging instance obtained. Registering Service Worker...')
            
            // Explicitly register and wait for service worker to be ready
            const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
            console.log('Service Worker registered. Scope:', registration.scope)
            
            // Wait for it to be active
            await navigator.serviceWorker.ready
            
            console.log('Service Worker ready. Requesting FCM token...')
            const token = await getToken(m, { 
              vapidKey: VAPID_KEY,
              serviceWorkerRegistration: registration 
            })
            
            if (token) {
              console.log('FCM Token obtained successfully:', token.substring(0, 10) + '...')
              await saveFCMToken(user.uid, token)
            } else {
              console.warn('No token received')
            }
          } else {
            console.warn('Messaging not supported in this environment (isSupported returned false)')
          }
        }
      } catch (err: any) {
        console.error('Push Error Details:', err)
        setError('Push Error: ' + (err.message || 'Unknown error'))
        // We don't return here, we still want to save other settings
      }
    }

    try {
      console.log('Updating user settings in database...')
      await updateUserSettings(user.uid, {
        theme, rememberMe, language, timezone,
        notifications: { feeding, medication, push },
      })
      await refreshUserData()
      console.log('Settings saved successfully. Redirecting...')
      router.push('/dashboard')
    } catch (err: any) {
      console.error('Database Save Error:', err)
      setError('Save Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logOut()
    router.replace('/login')
  }

  async function handleDeleteAccount() {
    if (!user) return
    try {
      await deleteUser(user)
      router.replace('/login')
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError(t('common.recentLogin'))
      } else {
        setError(err.message)
      }
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('settings.title')} action={{ label: saving ? t('common.saving') : t('common.save'), onClick: save }} />

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
                {th.dots.map((c: string, i: number) => (
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

        <div className="mb-4">
          <label className="input-label">{t('settings.language')}</label>
          <select className="input-field" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="input-label">{t('settings.timezone') || 'Timezone'}</label>
          <select className="input-field" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
            <option value="Europe/Berlin">Europe/Berlin (German Time)</option>
            <option value="UTC">UTC</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Asia/Tokyo">Asia/Tokyo</option>
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

        {!showDeleteConfirm ? (
          <button
            className="btn-outline text-sm"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t('settings.deleteAccount')}
          </button>
        ) : (
          <div className="rounded-[14px] p-4 mt-2" style={{ background: 'var(--rose-bg)', border: '2px solid var(--danger)' }}>
            <p className="text-[14px] font-semibold mb-1" style={{ color: 'var(--danger)' }}>{t('baby.parentProfile.areYouSure')}</p>
            <p className="text-[13px] mb-4" style={{ color: 'var(--text2)' }}>
              {t('baby.parentProfile.deleteWarning')}
            </p>
            <div className="flex gap-2">
              <button
                className="flex-1 py-[12px] rounded-[10px] text-[14px] font-semibold"
                style={{ background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer' }}
                onClick={handleDeleteAccount}
              >
                {t('baby.parentProfile.yesDelete')}
              </button>
              <button className="flex-1 btn-ghost" onClick={() => setShowDeleteConfirm(false)}>{t('common.cancel')}</button>
            </div>
          </div>
        )}
        {error && <p className="text-[12px] mt-2" style={{ color: 'var(--danger)' }}>{error}</p>}
      </div>

      <TabBar active="settings" />
    </div>
  )
}
