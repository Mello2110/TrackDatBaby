'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { updateUserProfile, createBaby } from '@/lib/db'
import { InputGroup, SelectGroup } from '@/components/ui'

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-[7px]">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: i === step ? 20 : 7,
            height: 7,
            background: i === step ? 'var(--accent)' : 'var(--border2)',
          }}
        />
      ))}
    </div>
  )
}

import { Suspense } from 'react'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="page-bg min-h-screen" />}>
      <OnboardingContent />
    </Suspense>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUserData } = useAuth()

  const startStep = searchParams.get('step') === 'baby' ? 2 : 0
  const [step, setStep] = useState(startStep)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Step 2 — Parent Profile
  const [parentName, setParentName] = useState('')
  const [parentDob, setParentDob] = useState('')
  const [bloodType, setBloodType] = useState('')
  const [familyDiseases, setFamilyDiseases] = useState('')
  const [personalDiseases, setPersonalDiseases] = useState('')
  const [parentNotes, setParentNotes] = useState('')

  // Step 3 — Baby
  const [babyName, setBabyName] = useState('')
  const [babyDob, setBabyDob] = useState('')
  const [babyGender, setBabyGender] = useState<'girl' | 'boy' | 'other'>('girl')
  const [babyBloodType, setBabyBloodType] = useState('')
  const [birthWeight, setBirthWeight] = useState('')
  const [birthHeight, setBirthHeight] = useState('')

  async function handleParentSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')
    try {
      await updateUserProfile(user.uid, {
        name: parentName,
        dob: parentDob,
        bloodType,
        familyDiseases,
        personalDiseases,
        notes: parentNotes,
      } as any)
      await refreshUserData()
      setStep(2)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleBabySave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')
    try {
      await createBaby(user.uid, {
        name: babyName,
        dob: babyDob,
        gender: babyGender,
        bloodType: babyBloodType,
        birthWeight,
        birthHeight,
        allergies: '',
        medications: '',
        vaccinations: '',
        notes: '',
      })
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // ── STEP 0 — Welcome ──────────────────────────────────────
  if (step === 0) return (
    <div className="page-bg min-h-screen flex flex-col px-6 pt-[52px] pb-8">
      <ProgressDots step={0} total={3} />
      <div className="flex-1 flex flex-col justify-center">
        <div
          className="w-[64px] h-[64px] rounded-[18px] flex items-center justify-center mb-6"
          style={{ background: 'var(--accent-bg)', border: '2px solid var(--border2)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/>
            <path d="M12 2a7 7 0 0 1 7 7c0 4.4-3.5 8-7 8s-7-3.6-7-8a7 7 0 0 1 7-7z"/>
            <path d="M12 19v3M9 21h6"/>
          </svg>
        </div>
        <h1 className="text-[28px] font-bold mb-3" style={{ color: 'var(--text)', lineHeight: 1.2 }}>
          Welcome to<br />BabyTrack
        </h1>
        <p className="text-[15px] mb-2" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>
          Track every little moment — meals, milestones, health and growth — all in one place.
        </p>
        <p className="text-[14px] mb-10" style={{ color: 'var(--text3)', lineHeight: 1.6 }}>
          You can invite family members and caregivers to share access.
        </p>

        {/* Feature list */}
        {[
          {
            label: 'Feeding logs',
            color: '--rose-bg', stroke: '--rose',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
          },
          {
            label: 'Growth tracking',
            color: '--mint-bg', stroke: '--mint',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
          },
          {
            label: 'Milestones',
            color: '--lav-bg', stroke: '--lav',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--lav)" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
          },
          {
            label: 'Illness & health',
            color: '--blue-bg', stroke: '--blue',
            icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
          },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-3 mb-3">
            <div
              className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: `var(${f.color})`, border: '2px solid var(--border2)' }}
            >
              {f.icon}
            </div>
            <span className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>{f.label}</span>
          </div>
        ))}
      </div>

      <button className="btn-primary" onClick={() => setStep(1)}>
        Get started
      </button>
    </div>
  )

  // ── STEP 1 — Parent Profile ────────────────────────────────
  if (step === 1) return (
    <div className="page-bg min-h-screen flex flex-col">
      <div className="topbar">
        <button
          onClick={() => setStep(0)}
          className="flex items-center gap-1 text-[13px] font-semibold"
          style={{ color: 'var(--accent)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>
        <ProgressDots step={1} total={3} />
        <div style={{ width: 40 }} />
      </div>
      <div className="scroll-body">
        <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>Your profile</h2>
        <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>Tell us a bit about yourself. This helps us personalise your experience.</p>

        <form onSubmit={handleParentSave}>
          <InputGroup label="Full name" value={parentName} onChange={setParentName} placeholder="Your name" required />
          <InputGroup label="Date of birth" type="date" value={parentDob} onChange={setParentDob} />
          <SelectGroup
            label="Blood type"
            value={bloodType}
            onChange={setBloodType}
            options={[
              { value: '', label: 'Unknown' },
              { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A−' },
              { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B−' },
              { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB−' },
              { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O−' },
            ]}
          />
          <InputGroup label="Family diseases" value={familyDiseases} onChange={setFamilyDiseases}
            placeholder="e.g. Diabetes, heart disease…" textarea rows={2} />
          <InputGroup label="Personal medical history" value={personalDiseases} onChange={setPersonalDiseases}
            placeholder="e.g. Asthma, allergies…" textarea rows={2} />
          <InputGroup label="Notes" value={parentNotes} onChange={setParentNotes}
            placeholder="Anything else…" textarea rows={2} />

          {error && <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>{error}</p>}

          <button className="btn-primary mb-3" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Continue'}
          </button>
          <button type="button" className="btn-ghost" onClick={() => setStep(2)}>
            Skip for now
          </button>
        </form>
      </div>
    </div>
  )

  // ── STEP 2 — First Baby ────────────────────────────────────
  return (
    <div className="page-bg min-h-screen flex flex-col">
      <div className="topbar">
        {startStep !== 2 ? (
          <button
            onClick={() => setStep(1)}
            className="flex items-center gap-1 text-[13px] font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        ) : (
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1 text-[13px] font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Dashboard
          </button>
        )}
        {startStep !== 2 && <ProgressDots step={2} total={3} />}
        <div style={{ width: 40 }} />
      </div>
      <div className="scroll-body">
        <h2 className="text-[20px] font-bold mb-1" style={{ color: 'var(--text)' }}>Add your baby</h2>
        <p className="text-[13px] mb-5" style={{ color: 'var(--text3)' }}>
          {startStep === 2 ? 'Add another baby profile.' : "Let's set up your baby's profile."}
        </p>

        <form onSubmit={handleBabySave}>
          <InputGroup label="Baby's name" value={babyName} onChange={setBabyName} placeholder="e.g. Emma" required />
          <InputGroup label="Date of birth" type="date" value={babyDob} onChange={setBabyDob} required />

          {/* Gender selector */}
          <div className="mb-4">
            <label className="input-label">Gender</label>
            <div className="flex gap-2">
              {(['girl', 'boy', 'other'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setBabyGender(g)}
                  className="flex-1 py-[11px] rounded-[10px] text-[13px] font-semibold capitalize transition-all"
                  style={{
                    background: babyGender === g ? 'var(--accent)' : 'var(--surface)',
                    color: babyGender === g ? 'white' : 'var(--text2)',
                    border: `2px solid ${babyGender === g ? 'var(--accent)' : 'var(--border2)'}`,
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <SelectGroup
            label="Blood type"
            value={babyBloodType}
            onChange={setBabyBloodType}
            options={[
              { value: '', label: 'Unknown' },
              { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A−' },
              { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B−' },
              { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB−' },
              { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O−' },
            ]}
          />

          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <label className="input-label">Birth weight</label>
              <input className="input-field" type="text" value={birthWeight}
                onChange={(e) => setBirthWeight(e.target.value)} placeholder="e.g. 3.2 kg" />
            </div>
            <div className="flex-1">
              <label className="input-label">Birth height</label>
              <input className="input-field" type="text" value={birthHeight}
                onChange={(e) => setBirthHeight(e.target.value)} placeholder="e.g. 50 cm" />
            </div>
          </div>

          {error && <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>{error}</p>}

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'Creating…' : startStep === 2 ? 'Add baby' : 'Create profile & finish'}
          </button>

          {startStep !== 2 && (
            <button
              type="button"
              className="btn-ghost mt-3"
              onClick={() => router.push('/dashboard')}
            >
              I have an invite code (Skip)
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
