'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import { getBaby, getMeals, getStats } from '@/lib/db'
import { Topbar, TabBar, EntryTime } from '@/components/ui'
import { useLanguage } from '@/lib/LanguageContext'
import type { BabyProfile } from '@/types'

const getCats = (t: any) => [
  {
    key: 'meals', label: t('baby.dashboard.meals'), sub: t('baby.dashboard.mealsSub'),
    bgVar: '--rose-bg', strokeVar: '--rose',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  },
  {
    key: 'wellbeing', label: t('baby.dashboard.wellbeing'), sub: t('baby.dashboard.wellbeingSub'),
    bgVar: '--mint-bg', strokeVar: '--mint',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
  {
    key: 'stats', label: t('baby.dashboard.stats'), sub: t('baby.dashboard.statsSub'),
    bgVar: '--blue-bg', strokeVar: '--blue',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    key: 'caregivers', label: t('baby.dashboard.caregivers'), sub: t('baby.dashboard.caregiversSub'),
    bgVar: '--lav-bg', strokeVar: '--lav',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--lav)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
]

export default function BabyPage() {
  const { babyId } = useParams<{ babyId: string }>()
  const { user } = useAuth()
  const router = useRouter()
  const { t } = useLanguage()
  const [baby, setBaby] = useState<BabyProfile | null>(null)
  const [recentMeals, setRecentMeals] = useState<any[]>([])
  const [latestWeight, setLatestWeight] = useState<any>(null)
  const [latestHeight, setLatestHeight] = useState<any>(null)

  useEffect(() => {
    getBaby(babyId).then(setBaby)
    getMeals(babyId).then((m) => setRecentMeals(m.slice(0, 3)))
    // Get latest weight and height
    import('@/lib/db').then(({ getLatestStat }) => {
      getLatestStat(babyId, 'weight').then(setLatestWeight)
      getLatestStat(babyId, 'height').then(setLatestHeight)
    })
  }, [babyId])

  function getAgeDisplay(dob: string) {
    const birth = new Date(dob)
    const now = new Date()
    const diffMs = now.getTime() - birth.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const weeks = Math.floor(diffDays / 7)
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + now.getMonth() - birth.getMonth()

    if (months < 12) {
      return `${weeks} ${t('baby.dashboard.wk')}`
    }
    return months < 24 ? `${months} ${t('baby.dashboard.mo')}` : `${Math.floor(months / 12)} ${t('baby.dashboard.yr')}`
  }

  if (!baby) return <div className="page-bg flex items-center justify-center min-h-screen"><p style={{ color: 'var(--text3)' }}>{t('common.loading')}</p></div>

  const ageLabel = getAgeDisplay(baby.dob)

  const CATS = getCats(t)

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
            { label: t('baby.dashboard.weight'), value: latestWeight ? `${latestWeight.value} kg` : '—', bg: '--mint-bg' },
            { label: t('baby.dashboard.height'), value: latestHeight ? `${latestHeight.value} cm` : '—', bg: '--blue-bg' },
          ].map((s) => (
            <div key={s.label} className="rounded-[10px] p-3 text-center"
              style={{ background: `var(${s.bg})`, border: '2px solid var(--border2)' }}>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--text3)' }}>{s.label}</div>
              <div className="text-[14px] font-bold mt-[2px]" style={{ color: 'var(--text)' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Category buttons */}
        <div className="grid grid-cols-2 gap-[10px] mb-5">
          {CATS.map((cat) => (
            <div key={cat.key} className="cat-btn"
              onClick={() => router.push(`/baby/${babyId}/${cat.key}`)}>
              <div className="ci" style={{ background: `var(${cat.bgVar})` }}>
                {cat.icon}
              </div>
              <div className="text-[13px] font-bold mb-[2px]" style={{ color: 'var(--text)' }}>{cat.label}</div>
              <div className="text-[11px]" style={{ color: 'var(--text3)' }}>{cat.sub}</div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
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
