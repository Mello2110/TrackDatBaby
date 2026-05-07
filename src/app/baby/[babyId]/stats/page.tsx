'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getStats, addStat } from '@/lib/db'
import { getNowLocal, parseLocalToUTC } from '@/lib/utils'
import { Topbar, EntryTime, EmptyState } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import type { StatType, StatUnit } from '@/types'
import { Timestamp } from 'firebase/firestore'


const getStatTypes = (t: any): { value: StatType; label: string; unit: StatUnit; bg: string; stroke: string }[] => [
  { value: 'weight', label: t('baby.dashboard.weight'), unit: 'kg', bg: '--rose-bg', stroke: '--rose' },
  { value: 'height', label: t('baby.dashboard.height'), unit: 'cm', bg: '--mint-bg', stroke: '--mint' },
  { value: 'head_circumference', label: t('baby.stats.headCirc'), unit: 'cm', bg: '--blue-bg', stroke: '--blue' },
  { value: 'shoe_size', label: t('baby.stats.shoeSize'), unit: 'eu', bg: '--accent-bg', stroke: '--accent' },
]

export default function StatsPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user, userData } = useAuth()
  const { t } = useLanguage()
  const timezone = userData?.settings?.timezone || 'Europe/Berlin'
  const [stats, setStats] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statType, setStatType] = useState<StatType>('weight')
  const [value, setValue] = useState('')
  const [timestamp, setTimestamp] = useState(getNowLocal(timezone))
  const [notes, setNotes] = useState('')

  const STAT_TYPES = getStatTypes(t)

  useEffect(() => { loadStats() }, [babyId])
  async function loadStats() { setStats(await getStats(babyId)) }

  function getLatest(type: StatType) {
    return stats.find((s) => s.statType === type)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const selectedUnit = STAT_TYPES.find(s => s.value === statType)?.unit || 'kg'
    await addStat(babyId, {
      babyId, loggedBy: user.uid,
      timestamp: Timestamp.fromDate(parseLocalToUTC(timestamp, timezone)) as any,
      statType, value: parseFloat(value), unit: selectedUnit, notes,
    })
    await loadStats()
    setShowForm(false); setSaving(false); setValue(''); setNotes('')
    setTimestamp(getNowLocal(timezone))
  }

  if (showForm) return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('baby.stats.logTitle')} backLabel={t('common.cancel')} action={{ label: t('common.save'), onClick: () => {} }} />
      <div className="scroll-body">
        <form onSubmit={handleSave}>
          <div className="mb-4"><label className="input-label">{t('baby.stats.measurement')}</label>
            <select className="input-field" value={statType} onChange={(e) => setStatType(e.target.value as StatType)}>
              {STAT_TYPES.map(s => <option key={s.value} value={s.value}>{s.label} ({s.unit})</option>)}
            </select></div>
          <div className="mb-4"><label className="input-label">{t('baby.stats.value')}</label>
            <input className="input-field" type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0.0" required /></div>
          <div className="mb-4"><label className="input-label">{t('baby.meals.timestamp')}</label>
            <input className="input-field" type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} /></div>
          <div className="mb-5"><label className="input-label">{t('onboarding.notes')}</label>
            <textarea className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder={t('baby.meals.notesPh')}/></div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? t('common.saving') : t('baby.stats.saveMeasurement')}</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('baby.dashboard.stats')} backLabel={t('common.back')} backHref={`/baby/${babyId}`}
        action={{ label: '+ ' + t('tabs.add'), onClick: () => setShowForm(true) }} />
      <div className="scroll-body">
        {/* Summary grid */}
        <div className="grid grid-cols-2 gap-[10px] mb-5">
          {STAT_TYPES.map((st) => {
            const latest = getLatest(st.value)
            return (
              <div key={st.value} className="rounded-[10px] p-[14px] text-center"
                style={{ background: `var(${st.bg})`, border: '2px solid var(--border2)' }}>
                <div className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text3)' }}>{st.label}</div>
                <div className="text-[20px] font-bold" style={{ color: 'var(--text)' }}>
                  {latest ? latest.value : '—'}
                </div>
                <div className="text-[10px] font-semibold" style={{ color: 'var(--text3)' }}>{st.unit}</div>
              </div>
            )
          })}
        </div>

        {stats.length === 0 ? (
          <EmptyState message={t('baby.stats.empty')} />
        ) : (
          <>
            <div className="sec-title">{t('baby.stats.history')}</div>
            {stats.map((s) => (
              <div key={s.id} className="entry-card">
                <EntryTime ts={s.timestamp} />
                <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                  {STAT_TYPES.find(t => t.value === s.statType)?.label} — {s.value} {s.unit}
                </div>
                {s.notes && <div className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>{s.notes}</div>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
