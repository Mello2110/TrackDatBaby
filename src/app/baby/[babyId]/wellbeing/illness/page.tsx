'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getIllnesses, addIllness, deleteIllness } from '@/lib/db'
import { Topbar, EntryTime, EmptyState, Pill } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import { Timestamp } from 'firebase/firestore'
import type { SymptomType, IllnessStatus } from '@/types'

function nowLocal() {
  const d = new Date(); d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

function SeverityDots({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-[6px]">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={`sev-dot ${value >= n ? 'active' : ''}`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

const STATUS_COLOR: Record<IllnessStatus, 'rose' | 'accent' | 'mint'> = {
  ongoing: 'rose',
  improving: 'accent',
  resolved: 'mint',
}

export default function IllnessPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user } = useAuth()
  const { t } = useLanguage()
  const [entries, setEntries] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [timestamp, setTimestamp] = useState(nowLocal())
  const [symptomType, setSymptomType] = useState<SymptomType>('fever')
  const [temperature, setTemperature] = useState('')
  const [severity, setSeverity] = useState(5)
  const [medication, setMedication] = useState('')
  const [status, setStatus] = useState<IllnessStatus>('ongoing')
  const [notes, setNotes] = useState('')

  useEffect(() => { load() }, [babyId])

  async function load() {
    setEntries(await getIllnesses(babyId))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await addIllness(babyId, {
      babyId, loggedBy: user.uid,
      timestamp: Timestamp.fromDate(new Date(timestamp)) as any,
      symptomType, severity,
      temperature: temperature ? parseFloat(temperature) : undefined,
      medication: medication || undefined,
      status, notes: notes || undefined,
    })
    await load()
    setShowForm(false); setSaving(false)
    setTimestamp(nowLocal()); setTemperature(''); setMedication(''); setNotes(''); setSeverity(5)
  }

  const latest = entries[0]

  if (showForm) return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('baby.wellbeing.logIllness')} backLabel={t('common.cancel')} action={{ label: t('common.save'), onClick: () => {} }} />
      <div className="scroll-body">
        <form onSubmit={handleSave}>
          <div className="mb-4"><label className="input-label">{t('baby.meals.timestamp')}</label>
            <input className="input-field" type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} /></div>
          <div className="mb-4"><label className="input-label">{t('baby.wellbeing.symptom')}</label>
            <select className="input-field" value={symptomType} onChange={(e) => setSymptomType(e.target.value as SymptomType)}>
              <option value="fever">{t('baby.wellbeing.fever')}</option><option value="rash">{t('baby.wellbeing.rash')}</option>
              <option value="cough">{t('baby.wellbeing.cough')}</option><option value="vomiting">{t('baby.wellbeing.vomiting')}</option>
              <option value="diarrhoea">{t('baby.wellbeing.diarrhoea')}</option><option value="other">{t('baby.meals.other')}</option>
            </select></div>
          <div className="mb-4"><label className="input-label">{t('baby.wellbeing.temperature')} (°C, {t('common.optional')})</label>
            <input className="input-field" type="number" step="0.1" value={temperature}
              onChange={(e) => setTemperature(e.target.value)} placeholder="e.g. 38.5" /></div>
          <div className="mb-4">
            <label className="input-label">{t('baby.wellbeing.severity')} (1–10)</label>
            <SeverityDots value={severity} onChange={setSeverity} />
          </div>
          <div className="mb-4"><label className="input-label">{t('baby.wellbeing.medication')} ({t('common.optional')})</label>
            <input className="input-field" type="text" value={medication}
              onChange={(e) => setMedication(e.target.value)} placeholder="e.g. Paracetamol 2.5ml at 10:00" /></div>
          <div className="mb-4"><label className="input-label">{t('baby.wellbeing.status')}</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as IllnessStatus)}>
              <option value="ongoing">{t('baby.wellbeing.ongoing')}</option><option value="improving">{t('baby.wellbeing.improving')}</option><option value="resolved">{t('baby.wellbeing.resolved')}</option>
            </select></div>
          <div className="mb-5"><label className="input-label">{t('onboarding.notes')} ({t('common.optional')})</label>
            <textarea className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t('baby.meals.notesPh')} /></div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? t('common.saving') : t('baby.meals.saveEntry')}</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('baby.wellbeing.illness')} backLabel={t('common.back')} backHref={`/baby/${babyId}/wellbeing`}
        action={{ label: '+ ' + t('tabs.add'), onClick: () => setShowForm(true) }} />
      <div className="scroll-body">
        {latest ? (
          <div className="hi-card mb-3" style={{ background: 'var(--rose-bg)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>{t('baby.meals.latest')}</div>
            <div className="text-[15px] font-bold mb-2" style={{ color: 'var(--text)' }}>{t(`baby.wellbeing.${latest.symptomType}`)}</div>
            <div className="flex gap-2 flex-wrap">
              <Pill color="neutral">{t('baby.wellbeing.severity')} {latest.severity}/10</Pill>
              <Pill color={STATUS_COLOR[latest.status as IllnessStatus] || 'neutral'}>{t(`baby.wellbeing.${latest.status}`)}</Pill>
              {latest.temperature && <Pill color="neutral">{latest.temperature}°C</Pill>}
            </div>
          </div>
        ) : <EmptyState message={t('baby.wellbeing.illnessSub')} />}

        {entries.length > 0 && (
          <>
            <div className="sec-title mt-4">{t('baby.meals.allEntries')}</div>
            {entries.map((e) => (
              <div key={e.id} className="entry-card">
                <EntryTime ts={e.timestamp} />
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      {t(`baby.wellbeing.${e.symptomType}`)} · {t('baby.wellbeing.severity')} {e.severity}/10
                    </div>
                    <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text3)' }}>
                      {t(`baby.wellbeing.${e.status}`)}{e.temperature ? ` · ${e.temperature}°C` : ''}{e.medication ? ` · ${e.medication}` : ''}
                    </div>
                    {e.notes && <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text3)' }}>{e.notes}</div>}
                  </div>
                  <button onClick={async () => { await deleteIllness(babyId, e.id); load() }}
                    className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                    {t('baby.meals.delete')}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
