import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/LanguageContext'
import { useAuth } from '@/lib/AuthContext'
import { formatInTimezone } from '@/lib/utils'

// ── TOPBAR ────────────────────────────────────────────────
interface TopbarProps {
  title: string
  backLabel?: string
  backHref?: string
  action?: { label: string; onClick: () => void }
}

export function Topbar({ title, backLabel, backHref, action }: TopbarProps) {
  const router = useRouter()
  return (
    <div className="topbar">
      <div className="min-w-[60px]">
        {backLabel && (
          <button
            onClick={() => backHref ? router.push(backHref) : router.back()}
            className="flex items-center gap-1 text-[13px] font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {backLabel}
          </button>
        )}
      </div>
      <span className="topbar-title">{title}</span>
      <div className="min-w-[60px] text-right">
        {action && (
          <button
            onClick={action.onClick}
            className="text-[13px] font-semibold"
            style={{ color: 'var(--accent)' }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}

// ── TAB BAR ───────────────────────────────────────────────
type TabKey = 'home' | 'baby' | 'settings'

interface TabBarProps {
  active: TabKey
  babyId?: string
}

export function TabBar({ active, babyId }: TabBarProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const { userData } = useAuth()
  const firstBabyId = userData?.linkedBabies?.[0]
  const targetBabyId = babyId || firstBabyId

  return (
    <div className="tab-bar">
      <div
        className="flex-1 flex flex-col items-center gap-1 py-2 cursor-pointer"
        onClick={() => router.push('/dashboard')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={active === 'home' ? 'var(--accent)' : 'var(--text3)'}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className="text-[10px] font-semibold" style={{ color: active === 'home' ? 'var(--accent)' : 'var(--text3)' }}>{t('tabs.home')}</span>
      </div>
      <div
        className="flex-1 flex flex-col items-center gap-1 py-2 cursor-pointer"
        onClick={() => targetBabyId ? router.push(`/baby/${targetBabyId}`) : router.push('/onboarding?step=baby')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={active === 'baby' ? 'var(--accent)' : 'var(--text3)'}
          strokeWidth="2" strokeLinecap="round">
          <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/>
          <path d="M12 2a7 7 0 0 1 7 7c0 4.4-3.5 8-7 8s-7-3.6-7-8a7 7 0 0 1 7-7z"/>
          <path d="M12 19v3M9 21h6"/>
        </svg>
        <span className="text-[10px] font-semibold" style={{ color: active === 'baby' ? 'var(--accent)' : 'var(--text3)' }}>{t('settings.baby')}</span>
      </div>
      <div
        className="flex-1 flex flex-col items-center gap-1 py-2 cursor-pointer"
        onClick={() => router.push('/settings')}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke={active === 'settings' ? 'var(--accent)' : 'var(--text3)'}
          strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span className="text-[10px] font-semibold" style={{ color: active === 'settings' ? 'var(--accent)' : 'var(--text3)' }}>{t('tabs.settings')}</span>
      </div>
    </div>
  )
}

// ── TOGGLE ────────────────────────────────────────────────
interface ToggleRowProps {
  label: string
  value: boolean
  onChange: (v: boolean) => void
}

export function ToggleRow({ label, value, onChange }: ToggleRowProps) {
  return (
    <div className="flex justify-between items-center py-[13px]" style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-[14px]" style={{ color: 'var(--text)' }}>{label}</span>
      <div
        className={`toggle-track ${value ? 'active' : ''}`}
        onClick={() => onChange(!value)}
      >
        <div className="toggle-thumb" />
      </div>
    </div>
  )
}

// ── INPUT FIELD ───────────────────────────────────────────
interface InputGroupProps {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  textarea?: boolean
  disabled?: boolean
  rows?: number
}

export function InputGroup({
  label, type = 'text', value, onChange,
  placeholder, required, textarea, disabled, rows = 3
}: InputGroupProps) {
  return (
    <div className="mb-4">
      <label className="input-label">{label}</label>
      {textarea ? (
        <textarea
          className="input-field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          style={disabled ? { background: 'var(--bg2)', color: 'var(--text2)' } : {}}
        />
      ) : (
        <input
          className="input-field"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
      )}
    </div>
  )
}

// ── SELECT FIELD ──────────────────────────────────────────
interface SelectGroupProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

export function SelectGroup({ label, value, onChange, options }: SelectGroupProps) {
  return (
    <div className="mb-4">
      <label className="input-label">{label}</label>
      <select
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── PILL ──────────────────────────────────────────────────
interface PillProps {
  children: React.ReactNode
  color?: 'mint' | 'rose' | 'blue' | 'lav' | 'accent' | 'neutral'
}

export function Pill({ children, color = 'neutral' }: PillProps) {
  const colors: Record<string, { bg: string; text: string }> = {
    mint: { bg: 'var(--mint-bg)', text: 'var(--mint-text)' },
    rose: { bg: 'var(--rose-bg)', text: 'var(--rose-text)' },
    blue: { bg: 'var(--blue-bg)', text: 'var(--blue-text)' },
    lav: { bg: 'var(--lav-bg)', text: 'var(--lav-text)' },
    accent: { bg: 'var(--accent-bg)', text: 'var(--accent-text)' },
    neutral: { bg: 'var(--surface2)', text: 'var(--text2)' },
  }
  const c = colors[color]
  return (
    <span className="pill" style={{ background: c.bg, color: c.text }}>
      {children}
    </span>
  )
}

// ── ENTRY TIME ────────────────────────────────────────────
export function EntryTime({ ts }: { ts: Date | any }) {
  const { userData } = useAuth()
  const timezone = userData?.settings?.timezone || 'Europe/Berlin'
  const d = ts?.toDate ? ts.toDate() : new Date(ts)
  return (
    <div className="text-[11px] mb-[5px]" style={{ color: 'var(--text3)' }}>
      {formatInTimezone(d, timezone)}
    </div>
  )
}

// ── EMPTY STATE ───────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-10" style={{ color: 'var(--text3)' }}>
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text3)"
        strokeWidth="1.5" strokeLinecap="round" className="mx-auto mb-3">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>{message}</p>
    </div>
  )
}

// ── ENTRY CARD ────────────────────────────────────────────
export function EntryCard({ children, onEdit, onDelete }: { children: React.ReactNode; onEdit?: () => void; onDelete?: () => void }) {
  const { t } = useLanguage()
  const [showMenu, setShowMenu] = useState(false)
  
  return (
    <div className="entry-card relative group">
      <div className="pr-8">
        {children}
      </div>
      {(onEdit || onDelete) && (
        <div className="absolute top-3 right-3">
           <button onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }} className="p-1">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
           </button>
           {showMenu && (
             <div className="absolute right-0 top-8 bg-[var(--surface)] shadow-lg rounded-lg border border-[var(--border2)] py-1 z-10 w-32">
               {onEdit && (
                 <button className="w-full text-left px-4 py-2 text-[13px] hover:bg-[var(--bg2)] flex items-center gap-2" 
                   onClick={(e) => { e.stopPropagation(); onEdit(); setShowMenu(false); }}
                   style={{ color: 'var(--text)' }}
                 >
                   {t('common.edit')}
                 </button>
               )}
               {onDelete && (
                 <button className="w-full text-left px-4 py-2 text-[13px] hover:bg-[var(--bg2)] flex items-center gap-2" 
                   onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                   style={{ color: 'var(--danger)' }}
                 >
                   {t('common.delete')}
                 </button>
               )}
             </div>
           )}
        </div>
      )}
    </div>
  )
}
