'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { timeAgo } from '@/lib/utils'

interface HistoryClientProps {
  matches: Array<{
    id: string
    matched_at: string
    session_movies: {
      title: string
      poster_path: string
      match_score: number
      release_year: number
      tmdb_id: number
    } | null
  }>
}

export function HistoryClient({ matches }: HistoryClientProps) {
  const router = useRouter()

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0 bg-pattern pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-6 pt-6 pb-10">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </button>
          <h2 className="text-lg font-bold">Match History</h2>
          <div className="w-10" />
        </header>

        {matches.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">🎬</div>
              <h2 className="text-xl font-bold text-white mb-2">No matches yet</h2>
              <p className="text-slate-400 mb-6">Start a session to find your first match!</p>
              <button
                onClick={() => router.push('/dashboard')}
                className="h-12 px-6 bg-primary hover:bg-primary/90 rounded-full text-white font-bold"
              >
                Start a Session
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {matches.map((match) => {
              if (!match.session_movies) return null
              const movie = match.session_movies
              const poster = movie.poster_path
                ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                : null
              const percent = Math.round(movie.match_score * 100)

              return (
                <div
                  key={match.id}
                  className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 items-center"
                >
                  <div className="relative w-16 h-24 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                    {poster ? (
                      <Image
                        src={poster}
                        alt={movie.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-xl">🎬</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{movie.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        percent >= 90 ? 'match-excellent' : percent >= 80 ? 'match-great' : 'match-good'
                      }`}>
                        {percent}%
                      </span>
                      <span className="text-xs text-slate-500">{movie.release_year}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Matched {timeAgo(match.matched_at)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
