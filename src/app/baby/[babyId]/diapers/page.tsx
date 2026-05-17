'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getDiapers, addDiaper, deleteDiaper, updateDiaper } from '@/lib/db'
import { getNowLocal, parseLocalToUTC, formatInTimezone } from '@/lib/utils'
import { Topbar, EntryTime, EmptyState, EntryCard } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import type { DiaperType } from '@/types'
import { Timestamp } from 'firebase/firestore'

const DIAPER_TYPES: { value: DiaperType; emoji: string; color: string }[] = [
  { value: 'wet', emoji: '💧', color: '--blue' },
  { value: 'dirty', emoji: '💩', color: '--rose' },
  { value: 'both', emoji: '💧💩', color: '--lav' },
  { value: 'dry', emoji: '✅', color: '--mint' },
]

export default function DiapersPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user, userData } = useAuth()
  const { t } = useLanguage()
  const timezone = userData?.settings?.timezone || 'Europe/Berlin'

  const [entries, setEntries] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const [diaperType, setDiaperType] = useState<DiaperType>('wet')
  const [timestamp, setTimestamp] = useState(getNowLocal(timezone))
  const [notes, setNotes] = useState('')

  useEffect(() => { load() }, [babyId])

  async function load() {
    setEntries(await getDiapers(babyId))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    const data = {
      babyId, loggedBy: user.uid,
      timestamp: Timestamp.fromDate(parseLocalToUTC(timestamp, timezone)) as any,
      type: diaperType,
      notes: notes || undefined,
    }
    if (selectedEntry) {
      await updateDiaper(babyId, selectedEntry.id, data)
    } else {
      await addDiaper(babyId, data)
    }
    await load()
    setShowForm(false); setSaving(false); setNotes(''); setSelectedEntry(null)
    setTimestamp(getNowLocal(timezone))
  }

  function handleEdit(entry: any) {
    setSelectedEntry(entry)
    setDiaperType(entry.type)
    setNotes(entry.notes || '')
    const d = entry.timestamp?.toDate ? entry.timestamp.toDate() : new Date(entry.timestamp)
    const year = d.toLocaleString('en-US', { timeZone: timezone, year: 'numeric' })
    const month = d.toLocaleString('en-US', { timeZone: timezone, month: '2-digit' })
    const day = d.toLocaleString('en-US', { timeZone: timezone, day: '2-digit' })
    const hour = d.toLocaleString('en-US', { timeZone: timezone, hour: '2-digit', hour12: false })
    const min = d.toLocaleString('en-US', { timeZone: timezone, minute: '2-digit' })
    setTimestamp(`${year}-${month}-${day}T${hour === '24' ? '00' : hour}:${min}`)
    setShowForm(true)
  }

  async function handleDelete(id: string) {
    if (!confirm(t('baby.parentProfile.areYouSure'))) return
    await deleteDiaper(babyId, id)
    await load()
  }

  // Count today's changes
  const todayCount = entries.filter((e) => {
    const d = e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.timestamp)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  }).length

  const latest = entries[0]

  const getDiaperInfo = (type: DiaperType) =>
    DIAPER_TYPES.find((d) => d.value === type) || DIAPER_TYPES[0]

  if (showForm) return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar
        title={selectedEntry ? t('common.edit') : t('baby.diapers.logTitle')}
        backLabel={t('common.cancel')}
        action={{ label: t('common.save'), onClick: () => {} }}
      />
      <div className="scroll-body">
        <form onSubmit={handleSave}>
          <div className="mb-5">
            <label className="input-label">{t('baby.diapers.type')}</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {DIAPER_TYPES.map((dt) => (
                <button
                  key={dt.value}
                  type="button"
                  onClick={() => setDiaperType(dt.value)}
                  className="rounded-[12px] py-[14px] text-[13px] font-semibold transition-all flex flex-col items-center gap-1"
                  style={{
                    background: diaperType === dt.value ? `var(${dt.color})` : 'var(--surface)',
                    color: diaperType === dt.value ? 'white' : 'var(--text2)',
                    border: `2px solid ${diaperType === dt.value ? `var(${dt.color})` : 'var(--border2)'}`,
                  }}
                >
                  <span className="text-[20px]">{dt.emoji}</span>
                  {t(`baby.diapers.${dt.value}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="input-label">{t('baby.meals.timestamp')}</label>
            <input className="input-field" type="datetime-local" value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)} />
          </div>

          <div className="mb-5">
            <label className="input-label">{t('onboarding.notes')} ({t('common.optional')})</label>
            <textarea className="input-field" value={notes}
              onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder={t('baby.meals.notesPh')} />
          </div>

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? t('common.saving') : t('baby.meals.saveEntry')}
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar
        title={t('baby.diapers.title')}
        backLabel={t('common.back')}
        backHref={`/baby/${babyId}`}
        action={{ label: '+ ' + t('tabs.add'), onClick: () => { setSelectedEntry(null); setTimestamp(getNowLocal(timezone)); setShowForm(true) } }}
      />
      <div className="scroll-body">

        {/* Today's stats banner */}
        <div className="rounded-[14px] p-4 mb-4 flex items-center justify-between"
          style={{ background: 'var(--lav-bg)', border: '2px solid var(--border2)' }}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text3)' }}>
              {t('baby.diapers.todayCount')}
            </div>
            <div className="text-[28px] font-bold" style={{ color: 'var(--text)' }}>
              {todayCount} <span className="text-[14px] font-semibold" style={{ color: 'var(--text3)' }}>{t('baby.diapers.changes')}</span>
            </div>
          </div>
          {/* Type breakdown pills */}
          <div className="flex flex-col gap-1 items-end">
            {DIAPER_TYPES.map((dt) => {
              const count = entries.filter((e) => {
                const d = e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.timestamp)
                return d.toDateString() === new Date().toDateString() && e.type === dt.value
              }).length
              if (count === 0) return null
              return (
                <span key={dt.value} className="pill text-[12px]"
                  style={{ background: `var(${dt.color}-bg)`, color: `var(${dt.color}-text)` }}>
                  {dt.emoji} {count}
                </span>
              )
            })}
          </div>
        </div>

        {/* Latest entry */}
        {latest ? (
          <div className="hi-card mb-3" style={{ background: 'var(--blue-bg)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>{t('baby.diapers.latest')}</div>
            <div className="flex items-center gap-2">
              <span className="text-[24px]">{getDiaperInfo(latest.type).emoji}</span>
              <div>
                <div className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>
                  {t(`baby.diapers.${latest.type}`)}
                </div>
                <EntryTime ts={latest.timestamp} />
              </div>
            </div>
          </div>
        ) : (
          <EmptyState message={t('baby.diapers.empty')} />
        )}

        {/* History */}
        {entries.length > 0 && (
          <>
            <div className="sec-title mt-4">{t('baby.diapers.allEntries')}</div>
            {entries.map((e: any) => (
              <EntryCard key={e.id} onEdit={() => handleEdit(e)} onDelete={() => handleDelete(e.id)}>
                <EntryTime ts={e.timestamp} />
                <div className="flex items-center gap-2">
                  <span className="text-[18px]">{getDiaperInfo(e.type).emoji}</span>
                  <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                    {t(`baby.diapers.${e.type}`)}
                  </div>
                </div>
                {e.notes && <div className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>{e.notes}</div>}
              </EntryCard>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
