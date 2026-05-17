'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getBaby, getMeals } from '@/lib/db'
import { Topbar, TabBar, EntryTime } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import { formatAge, formatWeight } from '@/lib/units'
import type { BabyProfile } from '@/types'

// ─── Category definitions ────────────────────────────────
const DEFAULT_ORDER = ['meals', 'wellbeing', 'stats', 'diapers', 'caregivers', 'alarms']

const getCatDefs = (t: any): Record<string, { label: string; sub: string; bgVar: string; strokeVar: string; icon: React.ReactNode }> => ({
  meals: {
    label: t('baby.dashboard.meals'), sub: t('baby.dashboard.mealsSub'),
    bgVar: '--rose-bg', strokeVar: '--rose',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  },
  wellbeing: {
    label: t('baby.dashboard.wellbeing'), sub: t('baby.dashboard.wellbeingSub'),
    bgVar: '--mint-bg', strokeVar: '--mint',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
  stats: {
    label: t('baby.dashboard.stats'), sub: t('baby.dashboard.statsSub'),
    bgVar: '--blue-bg', strokeVar: '--blue',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  diapers: {
    label: t('baby.dashboard.diapers'), sub: t('baby.dashboard.diapersSub'),
    bgVar: '--lav-bg', strokeVar: '--lav',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--lav)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M3 6c0 0 2 3 2 6s-2 6-2 6h18c0 0-2-3-2-6s2-6 2-6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
  },
  caregivers: {
    label: t('baby.dashboard.caregivers'), sub: t('baby.dashboard.caregiversSub'),
    bgVar: '--lav-bg', strokeVar: '--lav',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--lav)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  alarms: {
    label: t('dashboard.alarms'), sub: t('dashboard.manageAlarms'),
    bgVar: '--accent-bg', strokeVar: '--accent',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="7"/><polyline points="12 9 12 12 13.5 13.5"/><path d="M16.5 3.5c1.5 1.5 1.5 1.5 1.5 1.5M7.5 3.5c-1.5 1.5-1.5 1.5-1.5 1.5"/></svg>,
  },
})

// ─── Reorder helpers ─────────────────────────────────────
function loadOrder(userId: string, babyId: string): string[] {
  if (typeof window === 'undefined') return DEFAULT_ORDER
  try {
    const stored = localStorage.getItem(`catOrder-${userId}-${babyId}`)
    if (stored) {
      const parsed: string[] = JSON.parse(stored)
      // Merge: keep stored order but add any new keys not yet in stored
      const merged = [...parsed.filter((k) => DEFAULT_ORDER.includes(k))]
      DEFAULT_ORDER.forEach((k) => { if (!merged.includes(k)) merged.push(k) })
      return merged
    }
  } catch {}
  return DEFAULT_ORDER
}

function saveOrder(userId: string, babyId: string, order: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(`catOrder-${userId}-${babyId}`, JSON.stringify(order))
}

export default function BabyPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user, userData } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()
  const [baby, setBaby] = useState<BabyProfile | null>(null)
  const [recentMeals, setRecentMeals] = useState<any[]>([])
  const [latestWeight, setLatestWeight] = useState<any>(null)
  const [latestHeight, setLatestHeight] = useState<any>(null)
  const [catOrder, setCatOrder] = useState<string[]>(DEFAULT_ORDER)
  const [reorderMode, setReorderMode] = useState(false)

  const settings = userData?.settings

  useEffect(() => {
    getBaby(babyId).then(setBaby)
    getMeals(babyId).then((m) => setRecentMeals(m.slice(0, 3)))
    import('@/lib/db').then(({ getLatestStat }) => {
      getLatestStat(babyId, 'weight').then(setLatestWeight)
      getLatestStat(babyId, 'height').then(setLatestHeight)
    })
  }, [babyId])

  // Load persisted order once user and baby are known
  useEffect(() => {
    if (user && babyId) {
      setCatOrder(loadOrder(user.uid, babyId))
    }
  }, [user, babyId])

  function moveItem(index: number, direction: -1 | 1) {
    const newOrder = [...catOrder]
    const target = index + direction
    if (target < 0 || target >= newOrder.length) return
    ;[newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]]
    setCatOrder(newOrder)
    if (user) saveOrder(user.uid, babyId, newOrder)
  }

  function resetOrder() {
    setCatOrder(DEFAULT_ORDER)
    if (user) saveOrder(user.uid, babyId, DEFAULT_ORDER)
  }

  if (!baby) return <div className="page-bg flex items-center justify-center min-h-screen"><p style={{ color: 'var(--text3)' }}>{t('common.loading')}</p></div>

  const ageLabel = formatAge(baby.dob, settings?.ageUnit, t)
  const CAT_DEFS = getCatDefs(t)

  return (
    <div className="page-bg flex flex-col min-h-screen">
      <Topbar
        title={baby.name}
        backLabel={t('tabs.home')}
        backHref="/dashboard"
        action={{ label: t('baby.dashboard.profile'), onClick: () => router.push(`/baby/${babyId}/profile`) }}
      />

      <div className="scroll-body">
        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {[
            { label: t('baby.dashboard.age'), value: ageLabel, bg: '--rose-bg' },
            {
              label: t('baby.dashboard.weight'),
              value: latestWeight
                ? formatWeight(latestWeight.value, settings?.weightUnit, t)
                : baby.birthWeight
                  ? formatWeight(parseFloat(baby.birthWeight), settings?.weightUnit, t)
                  : '—',
              bg: '--mint-bg',
            },
            {
              label: t('baby.dashboard.height'),
              value: latestHeight
                ? `${latestHeight.value} cm`
                : baby.birthHeight
                  ? `${parseFloat(baby.birthHeight)} cm`
                  : '—',
              bg: '--blue-bg',
            },
          ].map((s) => (
            <div key={s.label} className="rounded-[10px] p-3 text-center"
              style={{ background: `var(${s.bg})`, border: '2px solid var(--border2)' }}>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--text3)' }}>{s.label}</div>
              <div className="text-[14px] font-bold mt-[2px]" style={{ color: 'var(--text)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Section header with reorder toggle */}
        <div className="flex items-center justify-between mb-2">
          <div className="sec-title mb-0" style={{ marginBottom: 0 }}></div>
          <div className="flex items-center gap-2">
            {reorderMode && (
              <button
                onClick={resetOrder}
                className="text-[11px] font-semibold px-2 py-1 rounded-[6px]"
                style={{ color: 'var(--text3)', background: 'var(--surface2)', border: '1px solid var(--border2)' }}
              >
                Reset
              </button>
            )}
            <button
              onClick={() => setReorderMode(!reorderMode)}
              className="text-[11px] font-semibold px-3 py-1 rounded-[8px] transition-all"
              style={{
                color: reorderMode ? 'white' : 'var(--accent)',
                background: reorderMode ? 'var(--accent)' : 'var(--accent-bg)',
                border: '1.5px solid var(--accent)',
              }}
            >
              {reorderMode ? '✓ Fertig' : '↕ Anordnen'}
            </button>
          </div>
        </div>

        {/* Category grid or reorder list */}
        {reorderMode ? (
          // Reorder list view
          <div className="flex flex-col gap-[8px] mb-5">
            {catOrder.map((key, index) => {
              const cat = CAT_DEFS[key]
              if (!cat) return null
              return (
                <div key={key}
                  className="flex items-center gap-3 rounded-[14px] px-4 py-3"
                  style={{ background: 'var(--surface)', border: '2px solid var(--border2)' }}>
                  {/* Drag handle visual */}
                  <div className="flex flex-col gap-[3px] flex-shrink-0">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="flex gap-[3px]">
                        <div className="w-[4px] h-[4px] rounded-full" style={{ background: 'var(--text3)' }} />
                        <div className="w-[4px] h-[4px] rounded-full" style={{ background: 'var(--text3)' }} />
                      </div>
                    ))}
                  </div>

                  <div className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center flex-shrink-0"
                    style={{ background: `var(${cat.bgVar})` }}>
                    {cat.icon}
                  </div>

                  <div className="flex-1">
                    <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>{cat.label}</div>
                  </div>

                  {/* Up / Down buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center"
                      style={{
                        background: index === 0 ? 'var(--bg2)' : 'var(--accent-bg)',
                        border: '1.5px solid var(--border2)',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke={index === 0 ? 'var(--text3)' : 'var(--accent)'}
                        strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button
                      onClick={() => moveItem(index, 1)}
                      disabled={index === catOrder.length - 1}
                      className="w-[28px] h-[28px] rounded-[7px] flex items-center justify-center"
                      style={{
                        background: index === catOrder.length - 1 ? 'var(--bg2)' : 'var(--accent-bg)',
                        border: '1.5px solid var(--border2)',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke={index === catOrder.length - 1 ? 'var(--text3)' : 'var(--accent)'}
                        strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Normal 2-column grid
          <div className="grid grid-cols-2 gap-[10px] mb-5">
            {catOrder.map((key) => {
              const cat = CAT_DEFS[key]
              if (!cat) return null
              return (
                <div key={key} className="cat-btn"
                  onClick={() => router.push(`/baby/${babyId}/${key}`)}>
                  <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center mb-[10px]"
                    style={{ background: `var(${cat.bgVar})` }}>
                    {cat.icon}
                  </div>
                  <div className="text-[13px] font-bold mb-[2px]" style={{ color: 'var(--text)' }}>{cat.label}</div>
                  <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{cat.sub}</div>
                </div>
              )
            })}
          </div>
        )}

        {/* Recent meals */}
        {recentMeals.length > 0 && (
          <>
            <div className="sec-title">{t('baby.dashboard.recentMeals')}</div>
            {recentMeals.map((m) => (
              <div key={m.id} className="entry-card">
                <EntryTime ts={m.timestamp} />
                <div className="text-[13px]" style={{ color: 'var(--text)' }}>
                  {m.mealType.replace('_', ' ')} · {m.foodType.replace('_', ' ')} · {m.quantity} {m.unit}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <TabBar active="baby" babyId={babyId} />
    </div>
  )
}
