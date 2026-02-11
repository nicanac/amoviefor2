'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { MovieDetailModal } from '@/components/movie-detail-modal'
import { GlowingEffect } from '@/components/ui/glowing-effect'

interface SessionHistoryItem {
  id: string
  created_at: string
  movies: Array<{
    id: string
    tmdb_id: number
    title: string
    poster_path: string
    match_score: number
    release_year: number
  }>
}

interface HistoryClientProps {
  sessions: SessionHistoryItem[]
}

function formatSessionName(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistoryClient({ sessions }: HistoryClientProps) {
  const router = useRouter()
  const [expandedSession, setExpandedSession] = useState<string | null>(null)
  const [selectedMovie, setSelectedMovie] = useState<{
    tmdbId: number
    title: string
    posterPath: string
    matchScore: number
  } | null>(null)

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
          <h2 className="text-lg font-bold">Session History</h2>
          <div className="w-10" />
        </header>

        {sessions.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">🎬</div>
              <h2 className="text-xl font-bold text-white mb-2">No sessions yet</h2>
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
          <div className="space-y-4">
            {sessions.map((session) => {
              const isExpanded = expandedSession === session.id
              const topMovie = session.movies[0]
              const topPoster = topMovie?.poster_path
                ? `https://image.tmdb.org/t/p/w200${topMovie.poster_path}`
                : null

              return (
                <div key={session.id} className="relative rounded-2xl border-[0.75px] border-border p-2">
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                    borderWidth={3}
                  />
                  <div className="relative rounded-xl bg-white/5 border-[0.75px] border-white/5 overflow-hidden">
                    {/* Session header - clickable to expand */}
                    <button
                      onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
                    >
                    {/* Mini poster preview */}
                    <div className="relative w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                      {topPoster ? (
                        <Image
                          src={topPoster}
                          alt={topMovie?.title || 'Session'}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-lg">🎬</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white text-sm truncate">
                        {formatSessionName(session.created_at)}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {session.movies.length} movie{session.movies.length !== 1 ? 's' : ''} recommended
                      </p>
                    </div>
                    <svg
                      className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                    </svg>
                  </button>

                  {/* Expanded movie list */}
                  {isExpanded && (
                    <div className="border-t border-white/5 px-4 pb-4 pt-2 space-y-3">
                      {session.movies.map((movie) => {
                        const poster = movie.poster_path
                          ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                          : null
                        const percent = Math.round(movie.match_score * 100)

                        return (
                          <div
                            key={movie.id}
                            onClick={() => setSelectedMovie({
                              tmdbId: movie.tmdb_id,
                              title: movie.title,
                              posterPath: movie.poster_path,
                              matchScore: movie.match_score,
                            })}
                            className="flex gap-3 p-3 rounded-xl bg-white/5 items-center cursor-pointer hover:bg-white/10 transition-colors"
                          >
                            <div className="relative w-14 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                              {poster ? (
                                <Image
                                  src={poster}
                                  alt={movie.title}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-lg">🎬</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-sm truncate">{movie.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                                  percent >= 90 ? 'match-excellent' : percent >= 80 ? 'match-great' : 'match-good'
                                }`}>
                                  {percent}%
                                </span>
                                <span className="text-xs text-slate-500">{movie.release_year}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Movie Detail Modal */}
      {selectedMovie && (
        <MovieDetailModal
          tmdbId={selectedMovie.tmdbId}
          title={selectedMovie.title}
          posterPath={selectedMovie.posterPath}
          matchScore={selectedMovie.matchScore}
          onClose={() => setSelectedMovie(null)}
        />
      )}
    </div>
  )
}
