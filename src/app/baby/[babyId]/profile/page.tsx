'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getBaby, updateBabyProfile, hasFullAccess, deleteBaby } from '@/lib/db'
import { Topbar, InputGroup, SelectGroup } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import type { BabyProfile } from '@/types'

const getBloodOptions = (t: any) => [
  { value: '', label: t('common.unknown') },
  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A−' },
  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B−' },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB−' },
  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O−' },
]

export default function BabyProfilePage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()

  const [baby, setBaby] = useState<BabyProfile | null>(null)
  const [canEdit, setCanEdit] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  async function handleDelete() {
    if (!canEdit || !user) return
    setDeleting(true)
    try {
      await deleteBaby(babyId, user.uid)
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar
        title={t('baby.profile.title')}
        backLabel={t('common.back')}
        backHref={`/baby/${babyId}`}
        action={canEdit ? { label: saving ? t('common.saving') : saved ? t('baby.profile.saved') + ' ✓' : t('common.save'), onClick: handleSave } : undefined}
      />
      <div className="scroll-body">
        {!canEdit && (
          <div className="rounded-[10px] px-4 py-3 mb-5 text-[13px]"
            style={{ background: 'var(--surface)', border: '2px solid var(--border2)', color: 'var(--text3)' }}>
            {t('baby.profile.readOnly')}
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

        <InputGroup label={t('baby.profile.name')} value={name} onChange={setName} placeholder={t('baby.profile.namePh')} required disabled={!canEdit} />
        <InputGroup label={t('onboarding.dob')} type="date" value={dob} onChange={setDob} disabled={!canEdit} />

        {/* Gender */}
        <div className="mb-4">
          <label className="input-label">{t('onboarding.gender')}</label>
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
                  {t(`onboarding.${g}`)}
                </button>
            ))}
          </div>
        </div>

        <SelectGroup label={t('onboarding.bloodType')} value={bloodType} onChange={canEdit ? setBloodType : () => {}} options={getBloodOptions(t)} />

        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="input-label">{t('onboarding.birthWeight')}</label>
            <input className="input-field" type="text" value={birthWeight}
              onChange={(e) => canEdit && setBirthWeight(e.target.value)}
              disabled={!canEdit} placeholder="e.g. 3.2 kg" />
          </div>
          <div className="flex-1">
            <label className="input-label">{t('onboarding.birthHeight')}</label>
            <input className="input-field" type="text" value={birthHeight}
              onChange={(e) => canEdit && setBirthHeight(e.target.value)}
              disabled={!canEdit} placeholder="e.g. 50 cm" />
          </div>
        </div>

        <InputGroup label={t('baby.profile.allergies')} value={allergies} onChange={canEdit ? setAllergies : () => {}}
          placeholder={t('baby.profile.allergiesPh')} textarea rows={2} disabled={!canEdit} />
        <InputGroup label={t('baby.profile.medications')} value={medications} onChange={canEdit ? setMedications : () => {}}
          placeholder={t('baby.profile.medicationsPh')} textarea rows={2} disabled={!canEdit} />
        <InputGroup label={t('baby.profile.vaccinations')} value={vaccinations} onChange={canEdit ? setVaccinations : () => {}}
          placeholder={t('baby.profile.vaccinationsPh')} textarea rows={2} disabled={!canEdit} />
        <InputGroup label={t('onboarding.notes')} value={notes} onChange={canEdit ? setNotes : () => {}}
          placeholder={t('onboarding.notesPh')} textarea rows={3} disabled={!canEdit} />

        {error && <p className="text-sm mb-4" style={{ color: 'var(--danger)' }}>{error}</p>}
        {canEdit && (
          <>
            <button className="btn-primary mb-6" onClick={handleSave} disabled={saving}>
              {saving ? t('common.saving') : saved ? t('baby.profile.saved') : t('baby.profile.saveBtn')}
            </button>

            <div className="divider mb-6" />
            <div className="sec-title">{t('baby.parentProfile.dangerZone')}</div>
            {!showDeleteConfirm ? (
              <button
                className="btn-outline mb-10"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                onClick={() => setShowDeleteConfirm(true)}
              >
                {t('baby.profile.deleteBtn')}
              </button>
            ) : (
              <div className="rounded-[14px] p-5 mb-10" style={{ background: 'var(--rose-bg)', border: '2px solid var(--danger)' }}>
                <p className="text-[15px] font-bold mb-1" style={{ color: 'var(--danger)' }}>{t('baby.profile.deleteTitle')}</p>
                <p className="text-[13px] mb-5 leading-relaxed" style={{ color: 'var(--text2)' }}>
                  {t('baby.profile.deleteConfirm')}
                </p>
                <div className="flex gap-2">
                  <button
                    className="flex-1 py-[12px] rounded-[10px] text-[14px] font-semibold"
                    style={{ background: 'var(--danger)', color: 'white', border: 'none', cursor: 'pointer' }}
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? t('common.saving') : t('baby.profile.deleteAction')}
                  </button>
                  <button className="flex-1 btn-ghost" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
