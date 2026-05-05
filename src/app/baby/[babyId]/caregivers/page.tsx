'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getBaby, generateInviteCode } from '@/lib/db'
import { hasFullAccess } from '@/lib/db'
import { Topbar, Pill } from '@/components/ui'
import type { BabyProfile, CaregiverRole, AccessLevel } from '@/types'

const ROLES: { value: CaregiverRole; label: string }[] = [
  { value: 'mother', label: 'Mother' },
  { value: 'father', label: 'Father' },
  { value: 'grandma', label: 'Grandma' },
  { value: 'grandad', label: 'Grandad' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'other', label: 'Other (custom)' },
]

export default function CaregiversPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user } = useAuth()
  const [baby, setBaby] = useState<BabyProfile | null>(null)
  const [showInvite, setShowInvite] = useState(false)
  const [role, setRole] = useState<CaregiverRole>('grandma')
  const [customName, setCustomName] = useState('')
  const [accessLevel, setAccessLevel] = useState<AccessLevel>('caregiver')
  const [generatedCode, setGeneratedCode] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => { getBaby(babyId).then(setBaby) }, [babyId])

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
      <Topbar title="Caregivers" backLabel="Back" backHref={`/baby/${babyId}`}
        action={canInvite ? { label: 'Invite', onClick: () => setShowInvite(!showInvite) } : undefined} />
      <div className="scroll-body">
        {/* Caregiver list */}
        {baby?.caregivers.map((c) => (
          <div key={c.userId} className="flex items-center gap-3 py-[13px]"
            style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="avatar" style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)', fontSize: 15 }}>
              {c.userId === user?.uid ? (user?.email?.charAt(0).toUpperCase() || 'U') : '?'}
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>
                {c.userId === user?.uid ? 'You' : `User ${c.userId.slice(0, 6)}`}
                {c.customRoleName ? ` (${c.customRoleName})` : ''}
              </div>
              <div className="text-[12px] mt-[1px]" style={{ color: 'var(--text3)' }}>
                {ROLES.find((r) => r.value === c.role)?.label || c.role}
              </div>
            </div>
            <Pill color={pillColor(c.accessLevel)}>
              {c.accessLevel === 'full' ? 'Full access' : 'Caregiver'}
            </Pill>
          </div>
        ))}

        {/* Invite section */}
        {canInvite && showInvite && (
          <div className="mt-5">
            <div className="sec-title">Generate invite</div>

            <div className="mb-4">
              <label className="input-label">Role</label>
              <select className="input-field" value={role} onChange={(e) => setRole(e.target.value as CaregiverRole)}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>

            {role === 'other' && (
              <div className="mb-4">
                <label className="input-label">Custom name</label>
                <input className="input-field" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="e.g. Oma Ingrid" />
              </div>
            )}

            <div className="mb-4">
              <label className="input-label">Access level</label>
              <select className="input-field" value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}>
                <option value="caregiver">Caregiver — log entries, view timeline</option>
                <option value="full">Full access — + edit profile, invite others</option>
              </select>
            </div>

            <button className="btn-primary mb-5" onClick={handleGenerate}>
              Generate invite code
            </button>

            {generatedCode && (
              <div className="invite-box">
                <div className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text3)' }}>
                  Invite code
                </div>
                <div className="text-[30px] font-bold mb-1" style={{ color: 'var(--accent)', letterSpacing: 5 }}>
                  {generatedCode}
                </div>
                <div className="text-[11px] font-semibold mb-4" style={{ color: 'var(--text3)' }}>
                  Expires in 24 hours · Single use
                </div>
                <button className="btn-primary text-sm" onClick={handleCopy}>
                  {copied ? 'Copied!' : 'Copy & share'}
                </button>
              </div>
            )}
          </div>
        )}

        {!canInvite && (
          <div className="mt-4 rounded-[10px] p-3" style={{ background: 'var(--bg2)', border: '2px solid var(--border)' }}>
            <p className="text-[12px] font-semibold leading-relaxed" style={{ color: 'var(--text3)' }}>
              Only caregivers with Full Access can invite others.
            </p>
          </div>
        )}

        <div className="mt-4 rounded-[10px] p-3" style={{ background: 'var(--bg2)', border: '2px solid var(--border)' }}>
          <p className="text-[12px] font-semibold leading-relaxed" style={{ color: 'var(--text3)' }}>
            At least one caregiver with Full Access must remain at all times.
          </p>
        </div>
      </div>
    </div>
  )
}
