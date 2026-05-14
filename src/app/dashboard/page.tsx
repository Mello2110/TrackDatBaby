'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getUserBabies, redeemInviteCode } from '@/lib/db'
import { Topbar, TabBar, Pill } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import type { BabyProfile } from '@/types'
import { formatAge } from '@/lib/units'

export default function DashboardPage() {
  const { user, userData, refreshUserData } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()
  const [babies, setBabies] = useState<BabyProfile[]>([])
  const [inviteCode, setInviteCode] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [loading, setLoading] = useState(true)

  const profile = userData?.profile
  const settings = userData?.settings
  const firstName = profile?.name?.split(' ')[0] || 'there'

  const hour = new Date().getHours()
  const greeting = hour < 12 ? t('dashboard.goodMorning') : hour < 17 ? t('dashboard.goodAfternoon') : t('dashboard.goodEvening')

  useEffect(() => {
    if (!user) return
    getUserBabies(user.uid)
      .then((b) => {
        setBabies(b)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to load babies:", err)
        setLoading(false)
      })
  }, [user])

  async function handleRedeemCode() {
    if (!inviteCode.trim() || !user) return
    setInviteError('')
    try {
      const babyId = await redeemInviteCode(inviteCode.trim().toUpperCase(), user.uid)
      await refreshUserData()
      router.push(`/baby/${babyId}`)
    } catch (err: any) {
      setInviteError(err.message)
    }
  }

  function getAgeLabel(dob: string) {
    return formatAge(dob, settings?.ageUnit, t)
  }

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <div className="topbar">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text3)' }}>
            {greeting}
          </div>
          <div className="topbar-title">{firstName}</div>
        </div>
        <button
          onClick={() => router.push('/settings')}
          className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center"
          style={{ background: 'var(--surface2)', border: '2px solid var(--border2)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      <div className="scroll-body">
        {/* Parent profile card */}
        <div className="card flex gap-[13px] items-center mb-5"
          onClick={() => router.push('/parent-profile')}>
          <div className="avatar" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)' }}>
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{profile?.name || t('dashboard.yourProfile')}</div>
            <div className="text-[12px] mt-[1px]" style={{ color: 'var(--text3)' }}>
              {profile?.bloodType ? `${t('dashboard.bloodType')} ${profile.bloodType} · ` : ''}{t('dashboard.viewProfile')}
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>


        {/* Babies */}
        <div className="sec-title">{t('dashboard.babiesTitle')}</div>

        {loading ? (
          <div className="text-sm" style={{ color: 'var(--text3)' }}>{t('common.loading')}</div>
        ) : babies.length === 0 ? (
          <div className="text-sm mb-4" style={{ color: 'var(--text3)' }}>
            {t('dashboard.noBabies')}
          </div>
        ) : (
          babies.map((baby) => {
            const myAccess = baby.caregivers.find((c) => c.userId === user?.uid)
            return (
              <div key={baby.id} className="card" onClick={() => router.push(`/baby/${baby.id}`)}>
                <div className="flex gap-[13px] items-center mb-3">
                  <div className="avatar" style={{ background: 'var(--rose-bg)', color: 'var(--rose-text)' }}>
                    {baby.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="text-[16px] font-bold" style={{ color: 'var(--text)' }}>{baby.name}</div>
                    <div className="text-[12px] mt-[1px]" style={{ color: 'var(--text3)' }}>
                      {getAgeLabel(baby.dob)} · {baby.gender}
                    </div>
                  </div>
                  <Pill color={myAccess?.accessLevel === 'full' ? 'mint' : 'neutral'}>
                    {myAccess?.accessLevel === 'full' ? t('dashboard.fullAccess') : t('dashboard.caregiver')}
                  </Pill>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: t('dashboard.caregivers'), value: `${baby.caregivers.length}` },
                    { label: t('dashboard.gender'), value: t(`onboarding.${baby.gender}`) },
                    { label: t('dashboard.bloodType'), value: baby.bloodType || '—' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-[8px] p-[10px] text-center"
                      style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}>
                      <div className="text-[10px] font-semibold mb-[3px]" style={{ color: 'var(--text3)' }}>{s.label}</div>
                      <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}

        {/* Add baby button */}
        <button
          className="btn-ghost flex items-center justify-center gap-2 text-sm mb-6"
          onClick={() => router.push('/onboarding?step=baby')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text2)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          {t('dashboard.addAnother')}
        </button>

        {/* Redeem invite */}
        <div className="sec-title">{t('dashboard.redeemTitle')}</div>
        <div className="flex gap-2">
          <input
            className="input-field flex-1"
            placeholder={t('dashboard.redeemPh')}
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ letterSpacing: inviteCode ? '3px' : undefined }}
          />
          <button className="btn-primary" style={{ width: 'auto', padding: '0 18px' }} onClick={handleRedeemCode}>
            {t('dashboard.joinBtn')}
          </button>
        </div>
        {inviteError && (
          <p className="text-sm mt-2" style={{ color: 'var(--danger)' }}>{inviteError}</p>
        )}
      </div>

      <TabBar active="home" babyId={babies[0]?.id} />
    </div>
  )
}
