'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { updateUserProfile } from '@/lib/db'
import { deleteUser } from 'firebase/auth'
import { Topbar, InputGroup, SelectGroup } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'

const getRoles = (t: any) => [
  { value: 'mother', label: t('baby.caregivers.mother') },
  { value: 'father', label: t('baby.caregivers.father') },
  { value: 'grandma', label: t('baby.caregivers.grandma') },
  { value: 'grandad', label: t('baby.caregivers.grandad') },
  { value: 'aunt', label: t('baby.caregivers.aunt') },
  { value: 'uncle', label: t('baby.caregivers.uncle') },
  { value: 'other', label: t('baby.meals.other') },
]

const getBloodOptions = (t: any) => [
  { value: '', label: t('baby.parentProfile.bloodUnknown') },
  { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A−' },
  { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B−' },
  { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB−' },
  { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O−' },
]

export default function ParentProfilePage() {
  const router = useRouter()
  const { user, userData, refreshUserData } = useAuth()
  const { t } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const [name, setName] = useState('')
  const [dob, setDob] = useState('')
  const [role, setRole] = useState<string>('other')
  const [bloodType, setBloodType] = useState('')
  const [familyDiseases, setFamilyDiseases] = useState('')
  const [personalDiseases, setPersonalDiseases] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const p = userData?.profile
    if (p) {
      setName(p.name || '')
      setDob(p.dob || '')
      setRole(p.role || 'other')
      setBloodType(p.bloodType || '')
      setFamilyDiseases(p.familyDiseases || '')
      setPersonalDiseases(p.personalDiseases || '')
      setNotes(p.notes || '')
    }
  }, [userData])

  async function handleSave() {
    if (!user) return
    setSaving(true); setError(''); setSaved(false)
    try {
      await updateUserProfile(user.uid, { name, dob, role, bloodType, familyDiseases, personalDiseases, notes } as any)
      await refreshUserData()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleDeleteAccount() {
    if (!user) return
    try {
      await deleteUser(user)
      router.replace('/login')
    } catch (err: any) { setError(err.message); setShowDeleteConfirm(false) }
  }

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar
        title={t('baby.parentProfile.title')}
        backLabel={t('common.back')}
        backHref="/dashboard"
        action={{ label: saving ? t('common.saving') : saved ? t('baby.profile.saved') + ' ✓' : t('common.save'), onClick: handleSave }}
      />
      <div className="scroll-body">
        <div className="flex justify-center mb-6">
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[28px] font-bold"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent-text)', border: '2px solid var(--border2)' }}
          >
            {name ? name.charAt(0).toUpperCase() : '?'}
          </div>
        </div>

        <InputGroup label={t('baby.parentProfile.fullName')} value={name} onChange={setName} placeholder={t('baby.parentProfile.fullNamePh')} required />
        <InputGroup label={t('baby.parentProfile.dob')} type="date" value={dob} onChange={setDob} />
        <SelectGroup label={t('baby.caregivers.role')} value={role} onChange={setRole} options={getRoles(t)} />
        <SelectGroup label={t('baby.parentProfile.bloodType')} value={bloodType} onChange={setBloodType} options={getBloodOptions(t)} />
        <InputGroup label={t('baby.parentProfile.familyHistory')} value={familyDiseases} onChange={setFamilyDiseases}
          placeholder={t('baby.parentProfile.familyHistoryPh')} textarea rows={3} />
        <InputGroup label={t('baby.parentProfile.personalHistory')} value={personalDiseases} onChange={setPersonalDiseases}
          placeholder={t('baby.parentProfile.personalHistoryPh')} textarea rows={3} />
        <InputGroup label={t('onboarding.notes')} value={notes} onChange={setNotes} placeholder={t('onboarding.notesPh')} textarea rows={3} />

        {error && <p className="text-sm mb-4" style={{ color: 'var(--danger)' }}>{error}</p>}
        <button className="btn-primary mb-4" onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving') : saved ? t('baby.profile.saved') : t('baby.profile.saveBtn')}
        </button>

        <div className="divider my-6" />
        <div className="sec-title">{t('baby.parentProfile.dangerZone')}</div>
        {!showDeleteConfirm ? (
          <button
            className="btn-outline"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
            onClick={() => setShowDeleteConfirm(true)}
          >
            {t('baby.parentProfile.deleteAcc')}
          </button>
        ) : (
          <div className="rounded-[14px] p-4" style={{ background: 'var(--rose-bg)', border: '2px solid var(--danger)' }}>
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
      </div>
    </div>
  )
}
