'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getDevelopments, addDevelopment, deleteDevelopment } from '@/lib/db'
import { Topbar, EntryTime, EmptyState, Pill } from '@/components/ui'
import { Timestamp } from 'firebase/firestore'
import type { MilestoneType, ComparisonStatus } from '@/types'

function nowLocal() {
  const d = new Date(); d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

const COMPARISON_OPTIONS: { value: ComparisonStatus; label: string; color: 'mint' | 'blue' | 'accent' }[] = [
  { value: 'early', label: 'Early ★', color: 'mint' },
  { value: 'on_time', label: 'On time ✓', color: 'blue' },
  { value: 'delayed', label: 'A bit later', color: 'accent' },
]

export default function DevelopmentPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user } = useAuth()
  const [entries, setEntries] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [timestamp, setTimestamp] = useState(nowLocal())
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
      timestamp: Timestamp.fromDate(new Date(timestamp)) as any,
      milestoneType, description,
      ageInMonths: parseInt(ageInMonths) || 0,
      comparisonStatus,
      notes: notes || undefined,
    })
    await load()
    setShowForm(false); setSaving(false)
    setTimestamp(nowLocal()); setDescription(''); setAgeInMonths(''); setNotes('')
  }

  const latest = entries[0]

  if (showForm) return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title="Log milestone" backLabel="Cancel" action={{ label: 'Save', onClick: () => {} }} />
      <div className="scroll-body">
        <form onSubmit={handleSave}>
          <div className="mb-4"><label className="input-label">Timestamp</label>
            <input className="input-field" type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} /></div>
          <div className="mb-4"><label className="input-label">Milestone type</label>
            <select className="input-field" value={milestoneType} onChange={(e) => setMilestoneType(e.target.value as MilestoneType)}>
              <option value="first_words">First words</option><option value="walking">Walking</option>
              <option value="social">Social</option><option value="learning">Learning</option><option value="other">Other</option>
            </select></div>
          <div className="mb-4"><label className="input-label">Description</label>
            <textarea className="input-field" value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder="Describe the milestone…" required /></div>
          <div className="mb-4"><label className="input-label">Age in months</label>
            <input className="input-field" type="number" value={ageInMonths}
              onChange={(e) => setAgeInMonths(e.target.value)} placeholder="e.g. 12" /></div>

          {/* Comparison status — 3 toggle buttons */}
          <div className="mb-5">
            <label className="input-label">Timing</label>
            <div className="flex gap-2">
              {COMPARISON_OPTIONS.map((o) => (
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
              Every baby develops at their own pace — all milestones come in time.
            </p>
          </div>

          <div className="mb-5"><label className="input-label">Notes (optional)</label>
            <textarea className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any notes…" /></div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save entry'}</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title="Development" backLabel="Back" backHref={`/baby/${babyId}/wellbeing`}
        action={{ label: '+ Add', onClick: () => setShowForm(true) }} />
      <div className="scroll-body">
        {latest ? (
          <div className="hi-card mb-3" style={{ background: 'var(--lav-bg)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>Latest milestone</div>
            <div className="text-[15px] font-bold mb-1" style={{ color: 'var(--text)' }}>
              {latest.milestoneType?.replace('_', ' ')}
            </div>
            <div className="text-[13px] mb-2" style={{ color: 'var(--text2)' }}>{latest.description}</div>
            <div className="flex gap-2 flex-wrap">
              <Pill color="lav">{latest.ageInMonths} months</Pill>
              <Pill color={COMPARISON_OPTIONS.find(o => o.value === latest.comparisonStatus)?.color || 'neutral'}>
                {COMPARISON_OPTIONS.find(o => o.value === latest.comparisonStatus)?.label || latest.comparisonStatus}
              </Pill>
            </div>
          </div>
        ) : <EmptyState message={'No milestones logged yet.\nTap + Add to get started.'} />}

        {entries.length > 0 && (
          <>
            <div className="sec-title mt-4">All milestones</div>
            {entries.map((e) => (
              <div key={e.id} className="entry-card">
                <EntryTime ts={e.timestamp} />
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-3">
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      {e.milestoneType?.replace('_', ' ')} · {e.ageInMonths}m
                    </div>
                    <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text2)' }}>{e.description}</div>
                    {e.notes && <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text3)' }}>{e.notes}</div>}
                  </div>
                  <button onClick={async () => { await deleteDevelopment(babyId, e.id); load() }}
                    className="text-[11px] px-2 py-1 rounded flex-shrink-0"
                    style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                    Delete
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
