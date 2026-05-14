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
import { getToken, deleteToken } from 'firebase/messaging'
import { saveFCMToken } from '@/lib/db'

const VAPID_KEY = "BN2DCRNIc3EPq53WWf4aGUDAztBpITlHqzmsLinjFwXxIFRWSfC1ZzqlRsfFpFkUVBC7jVMfI5YAlb7MpOy1I3c"

type Theme = 'light' | 'dark' | 'baby'

// Register FCM token after permission is granted (called async, not blocking the UI event)
async function registerFCMToken(uid: string) {
  try {
    const m = await messaging()
    if (!m) return
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
    await navigator.serviceWorker.ready
    const token = await getToken(m, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
    if (token) await saveFCMToken(uid, token)
  } catch (e) {
    console.error('FCM token registration failed:', e)
  }
}

export default function SettingsPage() {
  const { user, userData, refreshUserData } = useAuth()
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const router = useRouter()

  const settings: Partial<UserSettings> = userData?.settings || {}
  const [rememberMe, setRememberMe] = useState(settings.rememberMe ?? true)
  // Push defaults to false for all users
  const [push, setPush] = useState(settings.notifications?.push ?? false)
  const [language, setLanguage] = useState(settings.language || 'en')
  const [timezone, setTimezone] = useState(settings.timezone || 'Europe/Berlin')
  const [weightUnit, setWeightUnit] = useState(settings.weightUnit || 'kg')
  const [ageUnit, setAgeUnit] = useState(settings.ageUnit || 'weeks')

  const [saving, setSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [error, setError] = useState('')
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default')

  // Read browser permission state client-side only (SSR safe)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPushStatus(Notification.permission as any)
    } else if (typeof window !== 'undefined') {
      setPushStatus('unsupported')
    }
  }, [])

  // This is the key function: called DIRECTLY from the toggle click.
  // No async operations before Notification.requestPermission() — browser requires this.
  async function handlePushToggle(newValue: boolean) {
    if (!newValue) {
      // User is turning OFF → delete the FCM token to clean up stale tokens
      setPush(false)
      try {
        const m = await messaging()
        if (m) {
          await deleteToken(m)
        }
        // Clear from Firestore too
        if (user) {
          const { removeFCMToken } = await import('@/lib/db')
          // We don't know the exact token here, so we just clear the whole array
          const { doc, updateDoc } = await import('firebase/firestore')
          const { db } = await import('@/lib/firebase')
          await updateDoc(doc(db, 'users', user.uid), { fcmTokens: [] })
        }
      } catch (e) {
        console.error('Failed to delete FCM token:', e)
      }
      return
    }

    // User wants to turn ON
    if (pushStatus === 'unsupported') {
      alert('Dein Browser unterstützt leider keine Push-Benachrichtigungen.')
      return
    }

    if (pushStatus === 'denied') {
      alert('Du hast Push-Benachrichtigungen blockiert.\n\nBitte klicke auf das Schloss-Symbol 🔒 neben der Webseiten-Adresse und setze die Berechtigung für Benachrichtigungen zurück.')
      return
    }

    if (pushStatus === 'granted') {
      // Already have permission, just toggle on
      setPush(true)
      registerFCMToken(user!.uid)
      return
    }

    // pushStatus === 'default' → need to ask. This call MUST happen synchronously in a click handler.
    const permission = await Notification.requestPermission()
    setPushStatus(permission as any)

    if (permission === 'granted') {
      setPush(true)
      registerFCMToken(user!.uid)
    } else {
      setPush(false)
    }
  }

  async function save() {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      await updateUserSettings(user.uid, {
        theme, rememberMe, language, timezone,
        weightUnit: weightUnit as any,
        ageUnit: ageUnit as any,
        notifications: { feeding: push, medication: push, push },
      })
      await refreshUserData()
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
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

  const THEMES: { id: Theme; label: string; dots: string[] }[] = [
    { id: 'light', label: t('settings.light'), dots: ['#DDD7CC', '#F5F0E8', '#A85C28'] },
    { id: 'dark',  label: t('settings.dark'),  dots: ['#12100C', '#282018', '#D08848'] },
    { id: 'baby',  label: t('settings.baby'),  dots: ['#EDD8E4', '#FDF6FA', '#B83860'] },
  ]

  const pushStatusText = {
    granted: '✅ Erlaubnis erteilt',
    denied: '❌ Blockiert – Bitte Browser-Einstellungen zurücksetzen',
    unsupported: '❌ Von diesem Browser nicht unterstützt',
    default: '⏳ Noch nicht aktiviert',
  }[pushStatus]

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('settings.title')} action={{ label: saving ? '...' : t('common.save'), onClick: save }} />

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

        <div className="mb-4">
          <label className="input-label">{t('settings.weightUnit')}</label>
          <select className="input-field" value={weightUnit} onChange={(e) => setWeightUnit(e.target.value)}>
            <option value="kg">{t('baby.dashboard.kg')}</option>
            <option value="g">{t('baby.dashboard.g')}</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="input-label">{t('settings.ageUnit')}</label>
          <select className="input-field" value={ageUnit} onChange={(e) => setAgeUnit(e.target.value)}>
            <option value="default">{t('common.unknown')} (Default)</option>
            <option value="days">{t('baby.dashboard.days')}</option>
            <option value="weeks">{t('baby.dashboard.weeks')}</option>
            <option value="months">{t('baby.dashboard.months')}</option>
            <option value="years">{t('baby.dashboard.years')}</option>
          </select>
        </div>

        {/* Push Notifications — single unified toggle */}
        <div className="sec-title">{t('settings.pushNotifications')}</div>
        <div className="card mb-3 p-4">
          <ToggleRow
            label="Benachrichtigungen aktivieren"
            value={push}
            onChange={handlePushToggle}
          />
          <p className="text-[11px] mt-2" style={{ color: pushStatus === 'denied' ? 'var(--danger)' : 'var(--text3)' }}>
            {pushStatusText}
          </p>
        </div>

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
