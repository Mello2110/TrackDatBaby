'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getBehaviors, addBehavior, deleteBehavior } from '@/lib/db'
import { Topbar, EntryTime, EmptyState, Pill } from '@/components/ui'
import { Timestamp } from 'firebase/firestore'
import type { BehaviorType } from '@/types'

function nowLocal() {
  const d = new Date(); d.setSeconds(0, 0)
  return d.toISOString().slice(0, 16)
}

function ScaleSlider({
  label, min_label, max_label, value, onChange
}: {
  label: string; min_label: string; max_label: string; value: number; onChange: (v: number) => void
}) {
  return (
    <div className="mb-5">
      <label className="input-label">{label}</label>
      <div className="flex items-center gap-3 mt-1">
        <span className="text-[12px] w-[44px]" style={{ color: 'var(--text3)' }}>{min_label}</span>
        <div className="flex-1 relative">
          <input
            type="range" min={1} max={10} value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-[6px] rounded-full outline-none cursor-pointer appearance-none"
            style={{ accentColor: 'var(--accent)', background: `linear-gradient(to right, var(--accent) ${(value - 1) / 9 * 100}%, var(--border2) ${(value - 1) / 9 * 100}%)` }}
          />
        </div>
        <span className="text-[12px] w-[44px] text-right" style={{ color: 'var(--text3)' }}>{max_label}</span>
        <span
          className="text-[14px] font-bold w-[26px] text-center"
          style={{ color: 'var(--accent)' }}
        >
          {value}
        </span>
      </div>
    </div>
  )
}

export default function BehaviorPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user } = useAuth()
  const [entries, setEntries] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const [timestamp, setTimestamp] = useState(nowLocal())
  const [behaviorType, setBehaviorType] = useState<BehaviorType>('mood')
  const [description, setDescription] = useState('')
  const [energyScale, setEnergyScale] = useState(5)
  const [socialScale, setSocialScale] = useState(5)
  const [trigger, setTrigger] = useState('')
  const [duration, setDuration] = useState('')
  const [response, setResponse] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => { load() }, [babyId])

  async function load() {
    setEntries(await getBehaviors(babyId))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await addBehavior(babyId, {
      babyId, loggedBy: user.uid,
      timestamp: Timestamp.fromDate(new Date(timestamp)) as any,
      behaviorType, description, energyScale, socialScale,
      trigger: trigger || undefined,
      duration: duration || undefined,
      response: response || undefined,
      notes: notes || undefined,
    })
    await load()
    setShowForm(false); setSaving(false)
    setTimestamp(nowLocal()); setDescription(''); setEnergyScale(5); setSocialScale(5)
    setTrigger(''); setDuration(''); setResponse(''); setNotes('')
  }

  const latest = entries[0]

  if (showForm) return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title="Log behavior" backLabel="Cancel" action={{ label: 'Save', onClick: () => {} }} />
      <div className="scroll-body">
        <form onSubmit={handleSave}>
          <div className="mb-4"><label className="input-label">Timestamp</label>
            <input className="input-field" type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} /></div>
          <div className="mb-4"><label className="input-label">Behavior type</label>
            <select className="input-field" value={behaviorType} onChange={(e) => setBehaviorType(e.target.value as BehaviorType)}>
              <option value="mood">Mood</option><option value="energy">Energy</option>
              <option value="social">Social</option><option value="temperament">Temperament</option><option value="other">Other</option>
            </select></div>
          <div className="mb-4"><label className="input-label">Description</label>
            <textarea className="input-field" value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder="Describe the behavior…" required /></div>

          <ScaleSlider label="Energy level" min_label="Calm" max_label="Hyperactive"
            value={energyScale} onChange={setEnergyScale} />
          <ScaleSlider label="Social level" min_label="Shy" max_label="Outgoing"
            value={socialScale} onChange={setSocialScale} />

          <div className="mb-4"><label className="input-label">Trigger (optional)</label>
            <input className="input-field" type="text" value={trigger}
              onChange={(e) => setTrigger(e.target.value)} placeholder="e.g. Missed nap, new environment…" /></div>
          <div className="mb-4"><label className="input-label">Duration (optional)</label>
            <input className="input-field" type="text" value={duration}
              onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 30 min" /></div>
          <div className="mb-4"><label className="input-label">Response (optional)</label>
            <textarea className="input-field" value={response} onChange={(e) => setResponse(e.target.value)}
              rows={2} placeholder="What helped / what made it worse…" /></div>
          <div className="mb-5"><label className="input-label">Notes (optional)</label>
            <textarea className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any other notes…" /></div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save entry'}</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title="Behavior" backLabel="Back" backHref={`/baby/${babyId}/wellbeing`}
        action={{ label: '+ Add', onClick: () => setShowForm(true) }} />
      <div className="scroll-body">
        {latest ? (
          <div className="hi-card mb-3" style={{ background: 'var(--mint-bg)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>Latest</div>
            <div className="text-[15px] font-bold mb-1" style={{ color: 'var(--text)' }}>{latest.behaviorType}</div>
            <div className="text-[13px] mb-2" style={{ color: 'var(--text2)' }}>{latest.description}</div>
            <div className="flex gap-2 flex-wrap">
              <Pill color="neutral">Energy {latest.energyScale}/10</Pill>
              <Pill color="neutral">Social {latest.socialScale}/10</Pill>
              {latest.trigger && <Pill color="mint">Trigger: {latest.trigger}</Pill>}
            </div>
          </div>
        ) : <EmptyState message={'No behavior logged yet.\nTap + Add to get started.'} />}

        {entries.length > 0 && (
          <>
            <div className="sec-title mt-4">All entries</div>
            {entries.map((e) => (
              <div key={e.id} className="entry-card">
                <EntryTime ts={e.timestamp} />
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-3">
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      {e.behaviorType} · Energy {e.energyScale}/10 · Social {e.socialScale}/10
                    </div>
                    <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text2)' }}>{e.description}</div>
                    {e.trigger && <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text3)' }}>Trigger: {e.trigger}</div>}
                  </div>
                  <button onClick={async () => { await deleteBehavior(babyId, e.id); load() }}
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
