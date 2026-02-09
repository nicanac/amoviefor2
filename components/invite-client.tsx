'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { joinCouple } from '@/actions/couple'

interface InviteClientProps {
  profile: {
    id: string
    partner_code: string
    full_name: string | null
  }
  couple: {
    id: string
    user2_id: string | null
    status: string
  } | null
}

export function InviteClient({ profile, couple }: InviteClientProps) {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleJoin() {
    if (!joinCode.trim()) return
    setLoading(true)
    setError(null)

    const result = await joinCouple(joinCode.trim())
    if (result.error) {
      setError(result.error)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  function handleCopy() {
    navigator.clipboard.writeText(profile.partner_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // If couple is already active, redirect
  if (couple?.user2_id) {
    router.push('/dashboard')
    return null
  }

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0 bg-pattern pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-6 pt-8 pb-10">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Back
        </button>

        <div className="flex-1 flex flex-col justify-center">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Invite Your Partner</h1>
            <p className="text-slate-400">Share your code or enter theirs to connect</p>
          </div>

          {/* Your Code */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-6">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Your Partner Code</p>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-bold text-white tracking-[0.3em] font-mono">
                {profile.partner_code}
              </p>
              <button
                onClick={handleCopy}
                className="bg-primary/20 hover:bg-primary/30 p-3 rounded-xl transition-colors"
              >
                {copied ? (
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-slate-500 uppercase tracking-wider">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Join with code */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-3">Enter Partner&apos;s Code</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                placeholder="ABCDEF"
                className="flex-1 h-14 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 text-center tracking-[0.3em] font-mono font-bold text-xl uppercase"
              />
              <button
                onClick={handleJoin}
                disabled={loading || joinCode.length < 6}
                className="h-14 px-6 bg-primary hover:bg-primary/90 disabled:opacity-50 rounded-xl text-white font-bold transition-all"
              >
                {loading ? '...' : 'Join'}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-400 mt-2">{error}</p>
            )}
          </div>

          {/* Waiting indicator */}
          {couple && !couple.user2_id && (
            <div className="mt-6 text-center">
              <p className="text-primary font-medium text-sm animate-pulse">
                Waiting for partner to join...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
