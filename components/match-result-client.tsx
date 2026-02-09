'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface MatchMovie {
  id: string
  session_movie_id: string
  matched_at: string
  movie: {
    id: string
    tmdb_id: number
    title: string
    poster_path: string
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
}

export function MatchResultClient({ matches, sessionId }: MatchResultClientProps) {
  const router = useRouter()

  const sortedMatches = [...matches].sort((a, b) => {
    const scoreA = a.movie?.match_score || 0
    const scoreB = b.movie?.match_score || 0
    return scoreB - scoreA
  })

  const heroMatch = sortedMatches[0]
  const secondaryMatches = sortedMatches.slice(1)

  if (!heroMatch?.movie) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-screen">
        <div className="text-center">
          <div className="text-5xl mb-4">😔</div>
          <h2 className="text-2xl font-bold text-white mb-2">No Matches Yet</h2>
          <p className="text-slate-400 mb-6">Keep swiping to find your match!</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="h-14 px-8 bg-primary hover:bg-primary/90 rounded-full text-white font-bold shadow-lg shadow-primary/25"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const heroMovie = heroMatch.movie
  const heroPoster = heroMovie.poster_path
    ? `https://image.tmdb.org/t/p/w500${heroMovie.poster_path}`
    : null
  const heroPercent = Math.round(heroMovie.match_score * 100)

  return (
    <div className="relative flex flex-col min-h-screen w-full max-w-md mx-auto overflow-hidden bg-bg-dark">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between p-4 bg-bg-dark/95 backdrop-blur-md">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center justify-center p-2 rounded-full hover:bg-white/5 transition-colors"
        >
          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </button>
        <h2 className="text-lg font-bold tracking-tight">Top Matches</h2>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-24 overflow-y-auto no-scrollbar">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Based on both your tastes
          </h1>
          <p className="text-gray-400 text-sm">
            We found {matches.length} movie{matches.length !== 1 ? 's' : ''} you&apos;ll likely agree on.
          </p>
        </div>

        {/* Hero Card */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-surface-dark shadow-xl mb-6 group transition-transform duration-300 hover:scale-[1.01]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl pointer-events-none z-0" />
          {/* Poster */}
          <div className="relative h-64 w-full bg-gray-800">
            {heroPoster ? (
              <Image
                src={heroPoster}
                alt={heroMovie.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full text-5xl">🎬</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent" />
            {/* Match badge */}
            <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg border border-white/10 z-10">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {heroPercent}% Match
            </div>
          </div>

          {/* Content */}
          <div className="relative px-5 pb-6 -mt-12 z-10">
            <div className="flex items-end justify-between mb-3">
              <div>
                <span className="text-primary text-xs font-bold tracking-wider uppercase mb-1 block">
                  Perfect Match
                </span>
                <h2 className="text-3xl font-bold leading-none">{heroMovie.title}</h2>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-300 mb-4 font-medium">
              <span>{heroMovie.release_year}</span>
              <span className="w-1 h-1 rounded-full bg-gray-400" />
              <span>★ {heroMovie.vote_average.toFixed(1)}</span>
            </div>
            {/* Insight card */}
            <div className="bg-white/5 rounded-xl p-4 mb-5 border border-white/5">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                <p className="text-sm leading-relaxed text-gray-300">
                  <span className="font-bold text-white">Why you&apos;ll both love it: </span>
                  {heroMovie.overview.slice(0, 150)}...
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Cards */}
        {secondaryMatches.map((match) => {
          if (!match.movie) return null
          const movie = match.movie
          const poster = movie.poster_path
            ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
            : null
          const percent = Math.round(movie.match_score * 100)

          return (
            <div
              key={match.id}
              className="flex gap-4 p-4 rounded-2xl bg-surface-dark shadow-sm border border-white/5 mb-4 items-center"
            >
              <div className="relative w-20 h-28 shrink-0 rounded-lg overflow-hidden bg-gray-800">
                {poster ? (
                  <Image
                    src={poster}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-2xl">🎬</div>
                )}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <h3 className="text-lg font-bold truncate pr-2">{movie.title}</h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    percent >= 90 ? 'match-excellent' : percent >= 80 ? 'match-great' : 'match-good'
                  }`}>
                    {percent}% Match
                  </span>
                  <span className="text-xs text-gray-400">{movie.release_year}</span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                  {movie.overview}
                </p>
              </div>
            </div>
          )
        })}
      </main>

      {/* Floating CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-bg-dark via-bg-dark to-transparent z-20 flex justify-center w-full max-w-md mx-auto pointer-events-none">
        <button
          onClick={() => router.push('/dashboard')}
          className="pointer-events-auto w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-full shadow-lg shadow-primary/40 transition hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
        >
          <svg className="w-6 h-6 group-hover:animate-bounce" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Ready to Watch
        </button>
      </div>
    </div>
  )
}
