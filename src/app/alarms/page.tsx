'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { updateAlarms } from '@/lib/db'
import { Topbar, TabBar, ToggleRow, InputGroup, SelectGroup } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import type { Alarm } from '@/types'

export default function AlarmsPage() {
  const { user, userData, refreshUserData } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [type, setType] = useState<Alarm['type']>('feeding')
  const [label, setLabel] = useState('')
  const [time, setTime] = useState('08:00')

  const alarms = userData?.settings?.alarms || []

  async function handleSave() {
    if (!user) return
    setSaving(true)
    const newAlarm: Alarm = {
      id: Math.random().toString(36).slice(2, 9),
      type,
      label: label || (type === 'feeding' ? t('baby.meals.title') : type === 'medication' ? t('settings.medicationReminders') : t('baby.meals.other')),
      time,
      enabled: true,
    }
    const updated = [...alarms, newAlarm]
    await updateAlarms(user.uid, updated)
    await refreshUserData()
    setShowForm(false)
    setSaving(false)
    setLabel('')
  }

  async function handleDelete(id: string) {
    if (!user) return
    const updated = alarms.filter(a => a.id !== id)
    await updateAlarms(user.uid, updated)
    await refreshUserData()
  }

  async function toggleAlarm(id: string, enabled: boolean) {
    if (!user) return
    const updated = alarms.map(a => a.id === id ? { ...a, enabled } : a)
    await updateAlarms(user.uid, updated)
    await refreshUserData()
  }

  if (showForm) return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('dashboard.alarms') || 'Alarms'} backLabel={t('common.cancel')} action={{ label: t('common.save'), onClick: handleSave }} />
      <div className="scroll-body">
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

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar
        title={t('dashboard.alarms') || 'Alarms'}
        backLabel={t('common.back')}
        backHref="/dashboard"
        action={{ label: '+ ' + t('tabs.add'), onClick: () => setShowForm(true) }}
      />
      <div className="scroll-body">
        {alarms.length === 0 ? (
          <div className="text-center py-10" style={{ color: 'var(--text3)' }}>
            <p className="text-sm">{t('dashboard.noAlarms') || 'No alarms set'}</p>
          </div>
        ) : (
          alarms.sort((a, b) => a.time.localeCompare(b.time)).map((alarm) => (
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
                    className={`toggle-track ${alarm.enabled ? 'active' : ''}`}
                    onClick={() => toggleAlarm(alarm.id, !alarm.enabled)}
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
      <TabBar active="home" />
    </div>
  )
}
