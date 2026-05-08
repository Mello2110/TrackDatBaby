'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getBaby, updateBabyAlarms, toggleUserAlarm } from '@/lib/db'
import { Topbar, TabBar, InputGroup, SelectGroup } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import type { Alarm, BabyProfile } from '@/types'

export default function BabyAlarmsPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user, userData, refreshUserData } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  
  const [baby, setBaby] = useState<BabyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [type, setType] = useState<Alarm['type']>('feeding')
  const [label, setLabel] = useState('')
  const [time, setTime] = useState('08:00')

  const enabledAlarms = userData?.settings?.enabledAlarms || []

  useEffect(() => {
    async function load() {
      if (!user) return
      const b = await getBaby(babyId)
      setBaby(b)
      setLoading(false)
    }
    load()
  }, [babyId, user])

  async function handleSave() {
    if (!user || !baby) return
    setSaving(true)
    
    const newAlarm: Alarm = {
      id: Math.random().toString(36).slice(2, 9),
      type,
      label: label || (type === 'feeding' ? t('baby.meals.title') : type === 'medication' ? t('settings.medicationReminders') : t('baby.meals.other')),
      time,
      babyId: babyId
    }

    const updatedAlarms = [...(baby.alarms || []), newAlarm]
    await updateBabyAlarms(babyId, updatedAlarms)
    
    // Automatically enable it for the creator
    await toggleUserAlarm(user.uid, newAlarm.id, true)
    
    // Refresh local state
    setBaby({ ...baby, alarms: updatedAlarms })
    await refreshUserData()
    
    setShowForm(false)
    setSaving(false)
    setLabel('')
  }

  async function handleDelete(alarmId: string) {
    if (!user || !baby) return
    const updatedAlarms = (baby.alarms || []).filter(a => a.id !== alarmId)
    await updateBabyAlarms(babyId, updatedAlarms)
    
    // Cleanup user toggle if it was enabled
    if (enabledAlarms.includes(alarmId)) {
      await toggleUserAlarm(user.uid, alarmId, false)
    }

    setBaby({ ...baby, alarms: updatedAlarms })
    await refreshUserData()
  }

  async function handleToggle(alarmId: string, enabled: boolean) {
    if (!user) return
    await toggleUserAlarm(user.uid, alarmId, enabled)
    await refreshUserData()
  }

  if (loading) return <div className="page-bg min-h-screen" />
  if (!baby) return <div className="page-bg min-h-screen p-10">Baby not found</div>

  if (showForm) return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('dashboard.alarms') || 'Wecker'} backLabel={t('common.cancel')} action={{ label: t('common.save'), onClick: handleSave }} />
      <div className="scroll-body">
        <SelectGroup
          label={t('baby.caregivers.role') || 'Kategorie'}
          value={type}
          onChange={(v) => setType(v as Alarm['type'])}
          options={[
            { value: 'feeding', label: t('baby.meals.title') },
            { value: 'medication', label: t('settings.medicationReminders') },
            { value: 'custom', label: t('baby.meals.other') },
          ]}
        />
        <InputGroup
          label={t('baby.caregivers.customName') || 'Name des Weckers'}
          value={label}
          onChange={setLabel}
          placeholder="z.B. Morgenfläschchen"
        />
        <InputGroup
          label={t('baby.meals.timestamp') || 'Uhrzeit'}
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

  const alarms = baby.alarms || []

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar
        title={t('dashboard.alarms') || 'Wecker'}
        backLabel={t('common.back')}
        backHref={`/baby/${babyId}`}
        action={{ label: '+ ' + t('tabs.add'), onClick: () => setShowForm(true) }}
      />
      <div className="scroll-body">
        <div className="mb-6">
          <h2 className="text-[18px] font-bold" style={{ color: 'var(--text)' }}>{baby.name}</h2>
          <p className="text-[13px]" style={{ color: 'var(--text3)' }}>{t('dashboard.manageAlarms')}</p>
        </div>

        {alarms.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text3)' }}>
            <p className="text-sm">{t('dashboard.noAlarms') || 'Keine Wecker gestellt'}</p>
          </div>
        ) : (
          [...alarms].sort((a, b) => a.time.localeCompare(b.time)).map((alarm) => (
            <div key={alarm.id} className="card mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-[24px] font-bold" style={{ color: 'var(--text)' }}>{alarm.time}</div>
                  <div className="text-[13px] font-medium" style={{ color: 'var(--text2)' }}>
                    {alarm.label}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`toggle-track ${enabledAlarms.includes(alarm.id) ? 'active' : ''}`}
                    onClick={() => handleToggle(alarm.id, !enabledAlarms.includes(alarm.id))}
                  >
                    <div className="toggle-thumb" />
                  </div>
                  <button onClick={() => handleDelete(alarm.id)} style={{ color: 'var(--danger)' }}>
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
      <TabBar active="baby" babyId={babyId} />
    </div>
  )
}
