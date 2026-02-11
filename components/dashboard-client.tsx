'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logout } from '@/actions/auth'
import { createCouple, joinCouple, dissolveCouple } from '@/actions/couple'
import { createSession } from '@/actions/session'
import { useState } from 'react'
import { GlowingEffect } from '@/components/ui/glowing-effect'
import { ProfileBadge } from '@/components/profile-badge'

interface DashboardClientProps {
  profile: {
    id: string
    username: string | null
    full_name: string | null
    partner_code: string
    avatar_url: string | null
  }
  couple: {
    id: string
    user1_id: string
    user2_id: string | null
    status: string
  } | null
  activeSession: {
    id: string
    status: string
  } | null
}

export function DashboardClient({ profile, couple, activeSession }: DashboardClientProps) {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleHostSession() {
    setLoading(true)
    setError(null)

    try {
      // If no couple yet, create one first
      if (!couple) {
        const result = await createCouple()
        if (result.error) {
          setError(result.error)
          return
        }
        router.push('/invite')
        return
      }

      // If couple exists but no active session, create one
      if (!activeSession) {
        const result = await createSession(couple.id)
        if (result.error) {
          setError(result.error)
          if (result.sessionId) {
            router.push('/session/questions')
          }
          return
        }
        router.push('/session/questions')
        return
      }

      // Resume active session
      if (activeSession.status === 'answering') {
        router.push('/session/questions')
      } else if (activeSession.status === 'swiping') {
        router.push('/session/swipe')
      } else if (activeSession.status === 'completed') {
        router.push('/session/match')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDissolveCouple() {
    if (!couple) return
    if (!confirm('Are you sure you want to unpair? This will dissolve the current couple.')) return
    setLoading(true)
    setError(null)
    const result = await dissolveCouple(couple.id)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  async function handleJoinCouple() {
    if (!joinCode.trim()) return
    setLoading(true)
    setError(null)

    const result = await joinCouple(joinCode.trim())
    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // After joining, get the couple and auto-create a session
    const { getActiveCouple } = await import('@/actions/couple')
    const newCouple = await getActiveCouple()
    if (newCouple) {
      const sessionResult = await createSession(newCouple.id)
      if (sessionResult.error && !('sessionId' in sessionResult)) {
        setError(sessionResult.error)
        setLoading(false)
        return
      }
      router.push('/session/questions')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0 bg-pattern pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-6 pt-8 pb-10">
        {/* Header */}
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
            <span className="text-sm font-bold tracking-wide uppercase text-white/80 hidden sm:inline">MatchCut</span>
          </div>

          <div className="flex items-center gap-3">
            <ProfileBadge profile={profile} />
            <form action={logout}>
              <button
                type="submit"
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                title="Log out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">
            Hey, {profile.full_name || profile.username || 'Movie Lover'} 👋
          </h1>
          <p className="text-slate-400">Ready to find your next match?</p>
        </div>

        {/* Partner Code Card */}
        <div className="relative rounded-2xl border-[0.75px] border-border p-2 mb-6">
          <GlowingEffect
            spread={40}
            glow={true}
            disabled={false}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={3}
          />
          <div className="relative bg-white/5 backdrop-blur-md rounded-xl p-5 border-[0.75px] border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your Partner Code</span>
              <div className="bg-primary/20 p-1.5 rounded-lg">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-white tracking-[0.3em] font-mono">
              {profile.partner_code}
            </p>
            <p className="text-xs text-slate-500 mt-2">Share this code with your partner to connect</p>
          </div>
        </div>

        {/* Couple status */}
        {couple && couple.user2_id ? (
          <div className="relative rounded-2xl border-[0.75px] border-border p-2 mb-6">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <div className="relative bg-green-500/10 border-[0.75px] border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/20 p-2 rounded-xl">
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-400">Coupled Up!</p>
                  <p className="text-xs text-slate-400">You&apos;re ready to start a session</p>
                </div>
                <button
                  onClick={handleDissolveCouple}
                  disabled={loading}
                  className="text-xs text-red-400 hover:text-red-300 font-medium px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 transition-colors disabled:opacity-50"
                >
                  Unpair
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Join couple form */
          <div className="relative rounded-2xl border-[0.75px] border-border p-2 mb-6">
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={3}
            />
            <div className="relative bg-white/5 backdrop-blur-md rounded-xl p-5 border-[0.75px] border-white/10">
              <p className="text-sm font-semibold text-white mb-3">Join your partner</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="ABCDEF"
                  className="flex-1 h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center tracking-[0.3em] font-mono font-bold uppercase"
                />
                <button
                  onClick={handleJoinCouple}
                  disabled={loading || joinCode.length < 6}
                  className="h-12 px-5 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl text-white font-bold text-sm transition-all"
                >
                  Join
                </button>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-4 mt-auto">
          {/* Host / Resume Session */}
          <button
            onClick={handleHostSession}
            disabled={loading}
            className="group relative w-full flex items-center justify-between bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 h-16 px-2 rounded-full overflow-hidden shadow-lg shadow-primary/25 disabled:opacity-50"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center ml-1">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="text-white text-lg font-bold tracking-wide mr-auto pl-4">
              {activeSession ? 'Resume Session' : 'Start a Session'}
            </span>
            <div className="pr-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </div>
          </button>

          {/* History */}
          <Link
            href="/history"
            className="flex-1 h-14 bg-[#362348] hover:bg-[#442c5a] active:scale-[0.98] transition-all rounded-full text-white font-bold text-base border border-white/5 flex items-center justify-center gap-2 w-full"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
            </svg>
            Match History
          </Link>
        </div>
      </div>
    </div>
  )
}
