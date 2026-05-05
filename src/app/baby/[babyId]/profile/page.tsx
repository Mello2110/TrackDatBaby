'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getBaby, updateBabyProfile, hasFullAccess } from '@/lib/db'
import { Topbar, InputGroup, SelectGroup } from '@/components/ui'
import type { BabyProfile } from '@/types'

const BLOOD_OPTIONS = [
  { value: '', label: 'Unknown' },
  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A−' },
  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B−' },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB−' },
  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O−' },
]

export default function BabyProfilePage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user } = useAuth()

  const [baby, setBaby] = useState<BabyProfile | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [gender, setGender] = useState<'girl' | 'boy' | 'other'>('girl')
  const [bloodType, setBloodType] = useState('')
  const [birthWeight, setBirthWeight] = useState('')
  const [birthHeight, setBirthHeight] = useState('')
  const [allergies, setAllergies] = useState('')
  const [medications, setMedications] = useState('')
  const [vaccinations, setVaccinations] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    getBaby(babyId).then((b) => {
      if (!b) return
      setBaby(b)
      setCanEdit(user ? hasFullAccess(b, user.uid) : false)
      setName(b.name || '')
      setDob(b.dob || '')
      setGender(b.gender || 'girl')
      setBloodType(b.bloodType || '')
      setBirthWeight(b.birthWeight || '')
      setBirthHeight(b.birthHeight || '')
      setAllergies(b.allergies || '')
      setMedications(b.medications || '')
      setVaccinations(b.vaccinations || '')
      setNotes(b.notes || '')
    })
  }, [babyId, user])

  async function handleSave() {
    if (!canEdit) return
    setSaving(true); setError(''); setSaved(false)
    try {
      await updateBabyProfile(babyId, { name, dob, gender, bloodType, birthWeight, birthHeight, allergies, medications, vaccinations, notes })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar
        title="Baby profile"
        backLabel="Back"
        backHref={`/baby/${babyId}`}
        action={canEdit ? { label: saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save', onClick: handleSave } : undefined}
      />
      <div className="scroll-body">
        {!canEdit && (
          <div className="rounded-[10px] px-4 py-3 mb-5 text-[13px]"
            style={{ background: 'var(--surface)', border: '2px solid var(--border2)', color: 'var(--text3)' }}>
            Read-only — only Full Access caregivers can edit this profile.
          </div>
        )}

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[28px] font-bold"
            style={{ background: 'var(--rose-bg)', color: 'var(--rose-text)', border: '2px solid var(--border2)' }}
          >
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
        </div>

        <InputGroup label="Name" value={name} onChange={setName} placeholder="Baby's name" required disabled={!canEdit} />
        <InputGroup label="Date of birth" type="date" value={dob} onChange={setDob} disabled={!canEdit} />

        {/* Gender */}
        <div className="mb-4">
          <label className="input-label">Gender</label>
          <div className="flex gap-2">
            {(['girl', 'boy', 'other'] as const).map((g) => (
              <button
                key={g}
                type="button"
                disabled={!canEdit}
                onClick={() => canEdit && setGender(g)}
                className="flex-1 py-[11px] rounded-[10px] text-[13px] font-semibold capitalize transition-all"
                style={{
                  background: gender === g ? 'var(--accent)' : 'var(--surface)',
                  color: gender === g ? 'white' : 'var(--text2)',
                  border: `2px solid ${gender === g ? 'var(--accent)' : 'var(--border2)'}`,
                  opacity: !canEdit ? 0.6 : 1,
                  cursor: !canEdit ? 'default' : 'pointer',
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <SelectGroup label="Blood type" value={bloodType} onChange={canEdit ? setBloodType : () => {}} options={BLOOD_OPTIONS} />

        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="input-label">Birth weight</label>
            <input className="input-field" type="text" value={birthWeight}
              onChange={(e) => canEdit && setBirthWeight(e.target.value)}
              disabled={!canEdit} placeholder="e.g. 3.2 kg" />
          </div>
          <div className="flex-1">
            <label className="input-label">Birth height</label>
            <input className="input-field" type="text" value={birthHeight}
              onChange={(e) => canEdit && setBirthHeight(e.target.value)}
              disabled={!canEdit} placeholder="e.g. 50 cm" />
          </div>
        </div>

        <InputGroup label="Allergies" value={allergies} onChange={canEdit ? setAllergies : () => {}}
          placeholder="e.g. Peanuts, dairy…" textarea rows={2} disabled={!canEdit} />
        <InputGroup label="Current medications" value={medications} onChange={canEdit ? setMedications : () => {}}
          placeholder="e.g. Vitamin D drops…" textarea rows={2} disabled={!canEdit} />
        <InputGroup label="Vaccinations" value={vaccinations} onChange={canEdit ? setVaccinations : () => {}}
          placeholder="e.g. MMR, DTP…" textarea rows={2} disabled={!canEdit} />
        <InputGroup label="Notes" value={notes} onChange={canEdit ? setNotes : () => {}}
          placeholder="Any other notes…" textarea rows={3} disabled={!canEdit} />

        {error && <p className="text-sm mb-4" style={{ color: 'var(--danger)' }}>{error}</p>}
        {canEdit && (
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save profile'}
          </button>
        )}
      </div>
    </div>
  )
}
