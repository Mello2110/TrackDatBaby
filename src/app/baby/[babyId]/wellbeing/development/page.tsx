'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getDevelopments, addDevelopment, deleteDevelopment } from '@/lib/db'
import { getNowLocal, parseLocalToUTC } from '@/lib/utils'
import { Topbar, EntryTime, EmptyState, Pill } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import { Timestamp } from 'firebase/firestore'
import type { MilestoneType, ComparisonStatus } from '@/types'


const getComparisonOptions = (t: any): { value: ComparisonStatus; label: string; color: 'mint' | 'blue' | 'accent' }[] => [
  { value: 'early', label: t('baby.wellbeing.early'), color: 'mint' },
  { value: 'on_time', label: t('baby.wellbeing.on_time'), color: 'blue' },
  { value: 'delayed', label: t('baby.wellbeing.delayed'), color: 'accent' },
]

export default function DevelopmentPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user, userData } = useAuth()
  const { t } = useLanguage()
  const timezone = userData?.settings?.timezone || 'Europe/Berlin'
  const [entries, setEntries] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [timestamp, setTimestamp] = useState(getNowLocal(timezone))
  const [milestoneType, setMilestoneType] = useState<MilestoneType>('social')
  const [description, setDescription] = useState('')
  const [ageInMonths, setAgeInMonths] = useState('')
  const [comparisonStatus, setComparisonStatus] = useState<ComparisonStatus>('on_time')
  const [notes, setNotes] = useState('')

  useEffect(() => { load() }, [babyId])

  async function load() {
    setEntries(await getDevelopments(babyId))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await addDevelopment(babyId, {
      babyId, loggedBy: user.uid,
      timestamp: Timestamp.fromDate(parseLocalToUTC(timestamp, timezone)) as any,
      milestoneType, description,
      ageInMonths: parseInt(ageInMonths) || 0,
      comparisonStatus,
      notes: notes || undefined,
    })
    await load()
    setShowForm(false); setSaving(false)
    setTimestamp(getNowLocal(timezone)); setDescription(''); setAgeInMonths(''); setNotes('')
  }

  const latest = entries[0]

  if (showForm) return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('baby.wellbeing.logMilestone')} backLabel={t('common.cancel')} action={{ label: t('common.save'), onClick: () => {} }} />
      <div className="scroll-body">
        <form onSubmit={handleSave}>
          <div className="mb-4"><label className="input-label">{t('baby.meals.timestamp')}</label>
            <input className="input-field" type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} /></div>
          <div className="mb-4"><label className="input-label">{t('baby.wellbeing.milestoneType')}</label>
            <select className="input-field" value={milestoneType} onChange={(e) => setMilestoneType(e.target.value as MilestoneType)}>
              <option value="first_words">{t('baby.wellbeing.first_words')}</option><option value="walking">{t('baby.wellbeing.walking')}</option>
              <option value="social">{t('baby.wellbeing.social')}</option><option value="learning">{t('baby.wellbeing.learning')}</option><option value="other">{t('baby.meals.other')}</option>
            </select></div>
          <div className="mb-4"><label className="input-label">{t('baby.wellbeing.description')}</label>
            <textarea className="input-field" value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder={t('baby.wellbeing.descriptionPh')} required /></div>
          <div className="mb-4"><label className="input-label">{t('baby.wellbeing.ageInMonths')}</label>
            <input className="input-field" type="number" value={ageInMonths}
              onChange={(e) => setAgeInMonths(e.target.value)} placeholder="e.g. 12" /></div>

          {/* Comparison status — 3 toggle buttons */}
          <div className="mb-5">
            <label className="input-label">{t('baby.wellbeing.timing')}</label>
            <div className="flex gap-2">
              {getComparisonOptions(t).map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setComparisonStatus(o.value)}
                  className="flex-1 py-[10px] rounded-[10px] text-[12px] font-semibold transition-all"
                  style={{
                    background: comparisonStatus === o.value ? `var(--${o.color})` : 'var(--surface)',
                    color: comparisonStatus === o.value ? 'white' : 'var(--text2)',
                    border: `2px solid ${comparisonStatus === o.value ? `var(--${o.color})` : 'var(--border2)'}`,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="text-[12px] mt-3 italic" style={{ color: 'var(--text3)' }}>
              {t('baby.wellbeing.pace')}
            </p>
          </div>

          <div className="mb-5"><label className="input-label">{t('onboarding.notes')} ({t('common.optional')})</label>
            <textarea className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder={t('baby.meals.notesPh')} /></div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? t('common.saving') : t('baby.meals.saveEntry')}</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title={t('baby.wellbeing.development')} backLabel={t('common.back')} backHref={`/baby/${babyId}/wellbeing`}
        action={{ label: '+ ' + t('tabs.add'), onClick: () => setShowForm(true) }} />
      <div className="scroll-body">
        {latest ? (
          <div className="hi-card mb-3" style={{ background: 'var(--lav-bg)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>{t('baby.wellbeing.logMilestone')}</div>
            <div className="text-[15px] font-bold mb-1" style={{ color: 'var(--text)' }}>
              {t(`baby.wellbeing.${latest.milestoneType}`)}
            </div>
            <div className="text-[13px] mb-2" style={{ color: 'var(--text2)' }}>{latest.description}</div>
            <div className="flex gap-2 flex-wrap">
              <Pill color="lav">{latest.ageInMonths} {t('baby.dashboard.months')}</Pill>
              <Pill color={getComparisonOptions(t).find(o => o.value === latest.comparisonStatus)?.color || 'neutral'}>
                {getComparisonOptions(t).find(o => o.value === latest.comparisonStatus)?.label || latest.comparisonStatus}
              </Pill>
            </div>
          </div>
        ) : <EmptyState message={t('baby.wellbeing.developmentSub')} />}

        {entries.length > 0 && (
          <>
            <div className="sec-title mt-4">{t('baby.wellbeing.allMilestones')}</div>
            {entries.map((e) => (
              <div key={e.id} className="entry-card">
                <EntryTime ts={e.timestamp} />
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-3">
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      {t(`baby.wellbeing.${e.milestoneType}`)} · {e.ageInMonths}{t('baby.dashboard.mo')}
                    </div>
                    <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text2)' }}>{e.description}</div>
                    {e.notes && <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text3)' }}>{e.notes}</div>}
                  </div>
                  <button onClick={async () => { await deleteDevelopment(babyId, e.id); load() }}
                    className="text-[11px] px-2 py-1 rounded flex-shrink-0"
                    style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}>
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
