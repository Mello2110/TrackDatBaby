'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { updateBabyAlarms, toggleUserAlarm, getUserBabies } from '@/lib/db'
import { Topbar, TabBar, InputGroup, SelectGroup } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import type { Alarm, BabyProfile } from '@/types'

export default function AlarmsPage() {
  const { user, userData, refreshUserData } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  
  const [babies, setBabies] = useState<BabyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [selectedBabyId, setSelectedBabyId] = useState('')
  const [type, setType] = useState<Alarm['type']>('feeding')
  const [label, setLabel] = useState('')
  const [time, setTime] = useState('08:00')

  const enabledAlarms = userData?.settings?.enabledAlarms || []

  useEffect(() => {
    async function load() {
      if (!user) return
      const b = await getUserBabies(user.uid)
      setBabies(b)
      if (b.length > 0) setSelectedBabyId(b[0].id)
      setLoading(false)
    }
    load()
  }, [user])

  async function handleSave() {
    if (!user || !selectedBabyId) return
    setSaving(true)
    
    const baby = babies.find(b => b.id === selectedBabyId)
    if (!baby) return

    const newAlarm: Alarm = {
      id: Math.random().toString(36).slice(2, 9),
      type,
      label: label || (type === 'feeding' ? t('baby.meals.title') : type === 'medication' ? t('settings.medicationReminders') : t('baby.meals.other')),
      time,
      babyId: selectedBabyId
    }

    const updatedAlarms = [...(baby.alarms || []), newAlarm]
    await updateBabyAlarms(selectedBabyId, updatedAlarms)
    
    // Automatically enable it for the creator
    await toggleUserAlarm(user.uid, newAlarm.id, true)
    
    // Refresh local state
    setBabies(babies.map(b => b.id === selectedBabyId ? { ...b, alarms: updatedAlarms } : b))
    await refreshUserData()
    
    setShowForm(false)
    setSaving(false)
    setLabel('')
  }

  async function handleDelete(babyId: string, alarmId: string) {
    if (!user) return
    const baby = babies.find(b => b.id === babyId)
    if (!baby) return

    const updatedAlarms = (baby.alarms || []).filter(a => a.id !== alarmId)
    await updateBabyAlarms(babyId, updatedAlarms)
    
    // Cleanup user toggle if it was enabled
    if (enabledAlarms.includes(alarmId)) {
      await toggleUserAlarm(user.uid, alarmId, false)
    }

    setBabies(babies.map(b => b.id === babyId ? { ...b, alarms: updatedAlarms } : b))
    await refreshUserData()
  }

  async function handleToggle(alarmId: string, enabled: boolean) {
    if (!user) return
    await toggleUserAlarm(user.uid, alarmId, enabled)
    await refreshUserData()
  }

  if (loading) return <div className="page-bg min-h-screen" />

  if (showForm) return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('dashboard.alarms') || 'Wecker'} backLabel={t('common.cancel')} action={{ label: t('common.save'), onClick: handleSave }} />
      <div className="scroll-body">
        {babies.length > 1 && (
          <SelectGroup
            label={t('dashboard.babiesTitle') || 'Baby'}
            value={selectedBabyId}
            onChange={setSelectedBabyId}
            options={babies.map(b => ({ value: b.id, label: b.name }))}
          />
        )}
        <SelectGroup
          label={t('baby.caregivers.role') || 'Category'}
          value={type}
          onChange={(v) => setType(v as Alarm['type'])}
          options={[
            { value: 'feeding', label: t('baby.meals.title') },
            { value: 'medication', label: t('settings.medicationReminders') },
            { value: 'custom', label: t('baby.meals.other') },
          ]}
        />
        <InputGroup
          label={t('baby.caregivers.customName') || 'Label'}
          value={label}
          onChange={setLabel}
          placeholder="e.g. Morning Bottle"
        />
        <InputGroup
          label={t('baby.meals.timestamp') || 'Time'}
          type="time"
          value={time}
          onChange={setTime}
        />
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </div>
  )

  const allAlarms = babies.flatMap(b => (b.alarms || []).map(a => ({ ...a, babyName: b.name })))

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar
        title={t('dashboard.alarms') || 'Wecker'}
        backLabel={t('common.back')}
        backHref="/dashboard"
        action={{ label: '+ ' + t('tabs.add'), onClick: () => setShowForm(true) }}
      />
      <div className="scroll-body">
        {allAlarms.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text3)' }}>
            <p className="text-sm">{t('dashboard.noAlarms') || 'Keine Wecker gestellt'}</p>
          </div>
        ) : (
          [...allAlarms].sort((a, b) => a.time.localeCompare(b.time)).map((alarm) => (
            <div key={alarm.id} className="card mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[24px] font-bold" style={{ color: 'var(--text)' }}>{alarm.time}</div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text2)' }}>
                    {alarm.label} {babies.length > 1 && <span style={{ color: 'var(--text3)' }}>({alarm.babyName})</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`toggle-track ${enabledAlarms.includes(alarm.id) ? 'active' : ''}`}
                    onClick={() => handleToggle(alarm.id, !enabledAlarms.includes(alarm.id))}
                  >
                    <div className="toggle-thumb" />
                  </div>
                  <button onClick={() => handleDelete(alarm.babyId!, alarm.id)} style={{ color: 'var(--danger)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <TabBar active="home" />
    </div>
  )
}
