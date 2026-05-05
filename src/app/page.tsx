'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'

export default function HomePage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    // Check if onboarding is done
    const profile = userData?.profile
    if (!profile?.name) {
      router.replace('/onboarding')
      return
    }
    router.replace('/dashboard')
  }, [user, userData, loading, router])

  return (
    <div className="page-bg flex items-center justify-center min-h-screen">
      <div style={{ color: 'var(--text3)', fontSize: 14 }}>Loading…</div>
    </div>
  )
}
