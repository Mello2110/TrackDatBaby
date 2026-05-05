'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUpWithEmail, signInWithGoogle, signInWithApple } from '@/lib/auth'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await signUpWithEmail(email, password, rememberMe)
      router.replace('/onboarding')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogle() {
    setLoading(true)
    try {
      await signInWithGoogle()
      router.replace('/onboarding')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-bg min-h-screen flex flex-col px-6 pt-[44px] pb-7">
      <div className="mb-9">
        <div
          className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center mb-4"
          style={{ background: 'var(--accent-bg)', border: '2px solid var(--border2)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
            <path d="M9 12h.01M15 12h.01M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/>
            <path d="M12 2a7 7 0 0 1 7 7c0 4.4-3.5 8-7 8s-7-3.6-7-8a7 7 0 0 1 7-7z"/>
            <path d="M12 19v3M9 21h6"/>
          </svg>
        </div>
        <h1 style={{ color: 'var(--text)' }} className="text-[26px] font-bold tracking-tight mb-1">Create account</h1>
        <p style={{ color: 'var(--text2)' }} className="text-sm">Welcome to BabyTrack</p>
      </div>

      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label className="input-label">Email</label>
          <input className="input-field" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="mb-4">
          <label className="input-label">Password</label>
          <input className="input-field" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} />
        </div>
        <div className="flex items-center gap-2 mb-5">
          <div className={`toggle-track ${rememberMe ? 'active' : ''}`} onClick={() => setRememberMe(!rememberMe)}>
            <div className="toggle-thumb" />
          </div>
          <span style={{ color: 'var(--text2)', fontSize: 13 }}>Keep me signed in</span>
        </div>
        {error && <p className="text-sm mb-3" style={{ color: 'var(--danger)' }}>{error}</p>}
        <button className="btn-primary mb-3" type="submit" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-[2px]" style={{ background: 'var(--border2)' }} />
        <span style={{ color: 'var(--text3)', fontSize: 12, fontWeight: 600 }}>or</span>
        <div className="flex-1 h-[2px]" style={{ background: 'var(--border2)' }} />
      </div>

      <button className="social-btn" onClick={handleGoogle} type="button">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign up with Google
      </button>

      <div className="text-center mt-3">
        <span style={{ color: 'var(--text2)', fontSize: 13 }}>Already have an account? </span>
        <a href="/(auth)/login" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>Sign in</a>
      </div>
    </div>
  )
}
