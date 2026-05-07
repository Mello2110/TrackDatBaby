'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getBaby, generateInviteCode, getUser, hasFullAccess } from '@/lib/db'
import { Topbar, Pill } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import type { BabyProfile, CaregiverRole, AccessLevel } from '@/types'

const getRoles = (t: any): { value: CaregiverRole; label: string }[] => [
  { value: 'mother', label: t('baby.caregivers.mother') },
  { value: 'father', label: t('baby.caregivers.father') },
  { value: 'grandma', label: t('baby.caregivers.grandma') },
  { value: 'grandad', label: t('baby.caregivers.grandad') },
  { value: 'aunt', label: t('baby.caregivers.aunt') },
  { value: 'uncle', label: t('baby.caregivers.uncle') },
  { value: 'other', label: t('baby.meals.other') },
]

export default function CaregiversPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [baby, setBaby] = useState<BabyProfile | null>(null)
  const [caregiverProfiles, setCaregiverProfiles] = useState<Record<string, any>>({})
  const [showInvite, setShowInvite] = useState(false)
  const [role, setRole] = useState<CaregiverRole>('grandma')
  const [customName, setCustomName] = useState('')
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('caregiver')
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)

  const ROLES = getRoles(t)

  useEffect(() => {
    async function load() {
      const b = await getBaby(babyId)
      if (!b) return
      setBaby(b)
      
      // Fetch names for all caregivers
      const profiles: Record<string, any> = {}
      await Promise.all(b.caregivers.map(async (c) => {
        const u = await getUser(c.userId)
        if (u) profiles[c.userId] = u.profile
      }))
      setCaregiverProfiles(profiles)
    }
    load()
  }, [babyId])

  const canInvite = baby && user ? hasFullAccess(baby, user.uid) : false

  async function handleGenerate() {
    if (!user) return
    const code = await generateInviteCode(babyId, user.uid, role, accessLevel, customName)
    setGeneratedCode(code)
  }

  function handleCopy() {
    navigator.clipboard.writeText(generatedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pillColor = (level: AccessLevel) => level === 'full' ? 'mint' : 'neutral'

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('baby.caregivers.title')} backLabel={t('common.back')} backHref={`/baby/${babyId}`}
        action={canInvite ? { label: t('baby.caregivers.invite'), onClick: () => setShowInvite(!showInvite) } : undefined} />
      <div className="scroll-body">
        {/* Caregiver list */}
        {baby?.caregivers.map((c) => {
          const profile = caregiverProfiles[c.userId]
          const name = profile?.name || (c.userId === user?.uid ? t('baby.caregivers.you') : `User ${c.userId.slice(0, 4)}`)
          
          return (
            <div key={c.userId} className="flex items-center gap-3 py-[13px]"
              style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="avatar" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 15 }}>
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>
                  {name}
                  {c.customRoleName ? ` (${c.customRoleName})` : ''}
                </div>
                <div className="text-[12px] mt-[1px]" style={{ color: 'var(--text3)' }}>
                  {ROLES.find((r) => r.value === c.role)?.label || c.role}
                </div>
              </div>
              <Pill color={pillColor(c.accessLevel)}>
                {c.accessLevel === 'full' ? t('baby.caregivers.fullAccess') : t('baby.caregivers.caregiver')}
              </Pill>
            </div>
          )
        })}

        {/* Invite section */}
        {canInvite && showInvite && (
          <div className="mt-5">
            <div className="sec-title">{t('baby.caregivers.generateTitle')}</div>

            <div className="mb-4">
              <label className="input-label">{t('baby.caregivers.role')}</label>
              <select className="input-field" value={role} onChange={(e) => setRole(e.target.value as CaregiverRole)}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {role === 'other' && (
              <div className="mb-4">
                <label className="input-label">{t('baby.caregivers.customName')}</label>
                <input className="input-field" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Oma Ingrid" />
              </div>
            )}

            <div className="mb-4">
              <label className="input-label">{t('baby.caregivers.accessLevel')}</label>
              <select className="input-field" value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}>
                <option value="caregiver">{t('baby.caregivers.caregiverLevel')}</option>
                <option value="full">{t('baby.caregivers.fullLevel')}</option>
              </select>
            </div>

            <button className="btn-primary mb-5" onClick={handleGenerate}>
              {t('baby.caregivers.generateBtn')}
            </button>

            {generatedCode && (
              <div className="invite-box">
                <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>
                  {t('baby.caregivers.inviteCode')}
                </div>
                <div className="text-[30px] font-bold mb-1" style={{ color: 'var(--accent)', letterSpacing: 5 }}>
                  {generatedCode}
                </div>
                <div className="text-[11px] font-semibold mb-4" style={{ color: 'var(--text3)' }}>
                  {t('baby.caregivers.expires')}
                </div>
                <button className="btn-primary text-sm" onClick={handleCopy}>
                  {copied ? t('baby.profile.saved') : t('baby.caregivers.copyShare')}
                </button>
              </div>
            )}
          </div>
        )}

        {!canInvite && (
          <div className="mt-4 rounded-[10px] p-3" style={{ background: 'var(--bg2)', border: '2px solid var(--border)' }}>
            <p className="text-[12px] font-semibold leading-relaxed" style={{ color: 'var(--text3)' }}>
              {t('baby.caregivers.onlyFull')}
            </p>
          </div>
        )}

        <div className="mt-4 rounded-[10px] p-3" style={{ background: 'var(--bg2)', border: '2px solid var(--border)' }}>
          <p className="text-[12px] font-semibold leading-relaxed" style={{ color: 'var(--text3)' }}>
            {t('baby.caregivers.atLeastOne')}
          </p>
        </div>
      </div>
    </div>
  )
}
