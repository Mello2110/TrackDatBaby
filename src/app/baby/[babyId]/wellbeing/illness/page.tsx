'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getIllnesses, addIllness, deleteIllness } from '@/lib/db'
import { Topbar, EntryTime, EmptyState, Pill } from '@/components/ui'
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
      <Topbar title="Log illness" backLabel="Cancel" action={{ label: 'Save', onClick: () => {} }} />
      <div className="scroll-body">
        <form onSubmit={handleSave}>
          <div className="mb-4"><label className="input-label">Timestamp</label>
            <input className="input-field" type="datetime-local" value={timestamp} onChange={(e) => setTimestamp(e.target.value)} /></div>
          <div className="mb-4"><label className="input-label">Symptom</label>
            <select className="input-field" value={symptomType} onChange={(e) => setSymptomType(e.target.value as SymptomType)}>
              <option value="fever">Fever</option><option value="rash">Rash</option>
              <option value="cough">Cough</option><option value="vomiting">Vomiting</option>
              <option value="diarrhoea">Diarrhoea</option><option value="other">Other</option>
            </select></div>
          <div className="mb-4"><label className="input-label">Temperature (°C, optional)</label>
            <input className="input-field" type="number" step="0.1" value={temperature}
              onChange={(e) => setTemperature(e.target.value)} placeholder="e.g. 38.5" /></div>
          <div className="mb-4">
            <label className="input-label">Severity (1–10)</label>
            <SeverityDots value={severity} onChange={setSeverity} />
          </div>
          <div className="mb-4"><label className="input-label">Medication (optional)</label>
            <input className="input-field" type="text" value={medication}
              onChange={(e) => setMedication(e.target.value)} placeholder="e.g. Paracetamol 2.5ml at 10:00" /></div>
          <div className="mb-4"><label className="input-label">Status</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as IllnessStatus)}>
              <option value="ongoing">Ongoing</option><option value="improving">Improving</option><option value="resolved">Resolved</option>
            </select></div>
          <div className="mb-5"><label className="input-label">Notes (optional)</label>
            <textarea className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Any notes…" /></div>
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save entry'}</button>
        </form>
      </div>
    </div>
  )

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title="Illness" backLabel="Back" backHref={`/baby/${babyId}/wellbeing`}
        action={{ label: '+ Add', onClick: () => setShowForm(true) }} />
      <div className="scroll-body">
        {latest ? (
          <div className="hi-card mb-3" style={{ background: 'var(--rose-bg)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--text3)' }}>Latest</div>
            <div className="text-[15px] font-bold mb-2" style={{ color: 'var(--text)' }}>{latest.symptomType}</div>
            <div className="flex gap-2 flex-wrap">
              <Pill color="neutral">Severity {latest.severity}/10</Pill>
              <Pill color={STATUS_COLOR[latest.status as IllnessStatus] || 'neutral'}>{latest.status}</Pill>
              {latest.temperature && <Pill color="neutral">{latest.temperature}°C</Pill>}
            </div>
          </div>
        ) : <EmptyState message={'No illness logged yet.\nTap + Add to get started.'} />}

        {entries.length > 0 && (
          <>
            <div className="sec-title mt-4">All entries</div>
            {entries.map((e) => (
              <div key={e.id} className="entry-card">
                <EntryTime ts={e.timestamp} />
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>
                      {e.symptomType} · severity {e.severity}/10
                    </div>
                    <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text3)' }}>
                      {e.status}{e.temperature ? ` · ${e.temperature}°C` : ''}{e.medication ? ` · ${e.medication}` : ''}
                    </div>
                    {e.notes && <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text3)' }}>{e.notes}</div>}
                  </div>
                  <button onClick={async () => { await deleteIllness(babyId, e.id); load() }}
                    className="text-[11px] px-2 py-1 rounded" style={{ color: 'var(--danger)', border: '1px solid var(--danger)' }}>
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
