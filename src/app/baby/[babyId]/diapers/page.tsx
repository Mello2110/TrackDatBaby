'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getDiapers, addDiaper, deleteDiaper, updateDiaper } from '@/lib/db'
import { getNowLocal, parseLocalToUTC } from '@/lib/utils'
import { Topbar, EntryTime, EmptyState, EntryCard } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import type { DiaperType } from '@/types'
import { Timestamp } from 'firebase/firestore'

// ─── SVG icons per diaper type ───────────────────────────
const WetIcon = ({ color = 'currentColor', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6 8 4 13 4 15a8 8 0 0 0 16 0c0-2-2-7-8-13z"/>
  </svg>
)
const DirtyIcon = ({ color = 'currentColor', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="8"/>
    <path d="M8 12c0-2 1.5-4 4-4s4 2 4 4"/>
    <line x1="12" y1="16" x2="12" y2="16.01"/>
  </svg>
)
const BothIcon = ({ color = 'currentColor', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2C5 6 4 10 4 12a4 4 0 0 0 8 0c0-2-1-6-4-10z"/>
    <path d="M16 8c2 2 3 5 3 6a3 3 0 0 1-6 0c0-1 1-4 3-6z"/>
  </svg>
)
const DryIcon = ({ color = 'currentColor', size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

type DiaperDef = { value: DiaperType; color: string; Icon: React.FC<{ color?: string; size?: number }> }

const DIAPER_TYPES: DiaperDef[] = [
  { value: 'wet',   color: '--blue', Icon: WetIcon },
  { value: 'dirty', color: '--rose', Icon: DirtyIcon },
  { value: 'both',  color: '--lav',  Icon: BothIcon },
  { value: 'dry',   color: '--mint', Icon: DryIcon },
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

  const todayCount = entries.filter((e) => {
    const d = e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.timestamp)
    return d.toDateString() === new Date().toDateString()
  }).length

  const latest = entries[0]
  const getDiaperDef = (type: DiaperType) => DIAPER_TYPES.find((d) => d.value === type) || DIAPER_TYPES[0]

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
              {DIAPER_TYPES.map((dt) => {
                const isActive = diaperType === dt.value
                return (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() => setDiaperType(dt.value)}
                    className="rounded-[12px] py-[14px] text-[13px] font-semibold transition-all flex flex-col items-center gap-[8px]"
                    style={{
                      background: isActive ? `var(${dt.color})` : 'var(--surface)',
                      color: isActive ? 'white' : 'var(--text2)',
                      border: `2px solid ${isActive ? `var(${dt.color})` : 'var(--border2)'}`,
                    }}
                  >
                    <dt.Icon color={isActive ? 'white' : `var(${dt.color})`} size={20} />
                    {t(`baby.diapers.${dt.value}`)}
                  </button>
                )
              })}
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
              {todayCount}
              <span className="text-[14px] font-semibold ml-1" style={{ color: 'var(--text3)' }}>
                {t('baby.diapers.changes')}
              </span>
            </div>
          </div>
          {/* Type breakdown */}
          <div className="flex flex-col gap-[6px] items-end">
            {DIAPER_TYPES.map((dt) => {
              const count = entries.filter((e) => {
                const d = e.timestamp?.toDate ? e.timestamp.toDate() : new Date(e.timestamp)
                return d.toDateString() === new Date().toDateString() && e.type === dt.value
              }).length
              if (count === 0) return null
              return (
                <div key={dt.value} className="flex items-center gap-[5px] rounded-[6px] px-[8px] py-[3px]"
                  style={{ background: `var(${dt.color}-bg)` }}>
                  <dt.Icon color={`var(${dt.color})`} size={12} />
                  <span className="text-[12px] font-semibold" style={{ color: `var(${dt.color})` }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Latest entry */}
        {latest ? (() => {
          const def = getDiaperDef(latest.type)
          return (
            <div className="hi-card mb-3" style={{ background: `var(${def.color}-bg)` }}>
              <div className="text-[11px] mb-2" style={{ color: 'var(--text3)' }}>{t('baby.diapers.latest')}</div>
              <div className="flex items-center gap-3">
                <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                  style={{ background: `var(${def.color})` }}>
                  <def.Icon color="white" size={18} />
                </div>
                <div>
                  <div className="text-[15px] font-bold" style={{ color: 'var(--text)' }}>
                    {t(`baby.diapers.${latest.type}`)}
                  </div>
                  <EntryTime ts={latest.timestamp} />
                </div>
              </div>
            </div>
          )
        })() : (
          <EmptyState message={t('baby.diapers.empty')} />
        )}

        {/* History */}
        {entries.length > 0 && (
          <>
            <div className="sec-title mt-4">{t('baby.diapers.allEntries')}</div>
            {entries.map((e: any) => {
              const def = getDiaperDef(e.type)
              return (
                <EntryCard key={e.id} onEdit={() => handleEdit(e)} onDelete={() => handleDelete(e.id)}>
                  <EntryTime ts={e.timestamp} />
                  <div className="flex items-center gap-[10px]">
                    <div className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center flex-shrink-0"
                      style={{ background: `var(${def.color}-bg)` }}>
                      <def.Icon color={`var(${def.color})`} size={14} />
                    </div>
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      {t(`baby.diapers.${e.type}`)}
                    </div>
                  </div>
                  {e.notes && <div className="text-[12px] mt-1" style={{ color: 'var(--text3)' }}>{e.notes}</div>}
                </EntryCard>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
