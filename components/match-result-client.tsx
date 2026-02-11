'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MovieDetailModal } from '@/components/movie-detail-modal'
import { VerticalMovieStack } from '@/components/ui/vertical-movie-stack'
import { endSessionAndDecouple } from '@/actions/session'
import { ArrowLeft } from 'lucide-react'

interface MatchMovie {
  id: string
  session_movie_id: string
  matched_at: string
  movie: {
    id: string
    tmdb_id: number
    title: string
    poster_path: string | null
    overview: string
    release_year: number
    genres: string[]
    vote_average: number
    match_score: number
    rank: number
  } | undefined
}

interface MatchResultClientProps {
  matches: MatchMovie[]
  sessionId: string
  coupleId: string
}

export function MatchResultClient({ matches, sessionId, coupleId }: MatchResultClientProps) {
  const router = useRouter()
  const [selectedMovie, setSelectedMovie] = useState<{
    tmdbId: number
    title: string
    posterPath: string
    matchScore: number
  } | null>(null)

  const handleLeaveResults = useCallback(async () => {
    await endSessionAndDecouple(sessionId, coupleId)
    router.push('/dashboard')
  }, [sessionId, coupleId, router])

  // End session when user navigates away (beforeunload)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability on page unload
      navigator.sendBeacon(
        '/api/end-session',
        JSON.stringify({ sessionId, coupleId })
      )
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [sessionId, coupleId])

  // Sort matches by score for display
  const sortedMatches = [...matches].sort((a, b) => {
    const scoreA = a.movie?.match_score || 0
    const scoreB = b.movie?.match_score || 0
    return scoreB - scoreA
  })

  // Transform matches to movie format for the stack
  const movies = sortedMatches
    .filter((match) => match.movie)
    .map((match) => match.movie!)

  // Handle movie selection from stack
  const handleMovieSelect = useCallback((movie: typeof movies[0]) => {
    setSelectedMovie({
      tmdbId: movie.tmdb_id,
      title: movie.title,
      posterPath: movie.poster_path ?? '',
      matchScore: movie.match_score,
    })
  }, [])

  if (movies.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Matches Yet</h2>
          <p className="text-slate-400 mb-6">Start a new session to find movies!</p>
          <button
            onClick={handleLeaveResults}
            className="w-full h-12 bg-primary hover:bg-primary/90 rounded-full text-white font-bold shadow-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-screen w-full max-w-md mx-auto overflow-hidden bg-bg-dark">
      {/* Header */}
      <header className="flex-shrink-0 z-50 flex items-center justify-between p-4 bg-bg-dark/95 backdrop-blur-md border-b border-white/5">
        <button
          onClick={handleLeaveResults}
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="text-center">
          <h2 className="text-lg font-bold tracking-tight">Top Matches</h2>
          <p className="text-xs text-gray-400">{movies.length} movie{movies.length !== 1 ? 's' : ''} found</p>
        </div>
        <div className="w-10" />
      </header>

      {/* Movie Stack - Main Content */}
      <main className="flex-1 relative overflow-hidden">
        <VerticalMovieStack
          movies={movies}
          onMovieSelect={handleMovieSelect}
        />
      </main>

      {/* Floating CTA */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-t from-bg-dark via-bg-dark to-transparent">
        <button
          onClick={handleLeaveResults}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-full shadow-lg shadow-primary/40 transition hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
        >
          <svg className="w-6 h-6 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Done - End Session
        </button>
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
