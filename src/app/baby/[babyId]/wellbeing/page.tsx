'use client'
import { useParams, useRouter } from 'next/navigation'
import { Topbar } from '@/components/ui'

const SUBS = [
  {
    key: 'illness', label: 'Illness', sub: 'No active illness',
    bg: '--rose-bg', stroke: '--rose',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round"><path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  },
  {
    key: 'development', label: 'Development', sub: 'Track milestones',
    bg: '--lav-bg', stroke: '--lav',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--lav)" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  },
  {
    key: 'behavior', label: 'Behavior', sub: 'Mood & energy logs',
    bg: '--mint-bg', stroke: '--mint',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="3"/><line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="3"/></svg>,
  },
]

export default function WellbeingPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const router = useRouter()

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar title="Well-being" backLabel="Back" backHref={`/baby/${babyId}`} />
      <div className="scroll-body">
        {SUBS.map((s) => (
          <div key={s.key} className="sub-btn"
            onClick={() => router.push(`/baby/${babyId}/wellbeing/${s.key}`)}>
            <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center flex-shrink-0"
              style={{ background: `var(${s.bg})` }}>
              {s.icon}
            </div>
            <div>
              <div className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>{s.label}</div>
              <div className="text-[12px] mt-[2px]" style={{ color: 'var(--text3)' }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
