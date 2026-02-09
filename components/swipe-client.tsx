'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { recordSwipe } from '@/actions/swipe'
import { markAsSeen } from '@/actions/movies'

interface SessionMovie {
  id: string
  session_id: string
  tmdb_id: number
  title: string
  poster_path: string
  overview: string
  release_year: number
  genres: string[]
  vote_average: number
  match_score: number
  rank: number
}

interface SwipeClientProps {
  session: { id: string }
  movies: SessionMovie[]
  userId: string
}

export function SwipeClient({ session, movies, userId }: SwipeClientProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null)
  const [matchFound, setMatchFound] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const currentMovie = movies[currentIndex]
  const remaining = movies.length - currentIndex

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!currentMovie) return

    setSwipeDirection(direction)

    // Record swipe
    const result = await recordSwipe(session.id, currentMovie.id, direction)

    // If right swipe, mark as seen
    if (direction === 'right') {
      await markAsSeen(currentMovie.tmdb_id, 'auto')
    }

    // Short delay for animation
    await new Promise(resolve => setTimeout(resolve, 400))

    if (result.isMatch) {
      setMatchFound(currentMovie.title)
      // Redirect to match page after celebration
      setTimeout(() => router.push('/session/match'), 2000)
      return
    }

    setSwipeDirection(null)

    if (currentIndex + 1 >= movies.length) {
      // All movies swiped — go to match page or dashboard
      router.push('/session/match')
    } else {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentMovie, currentIndex, movies.length, router, session.id])

  // Match celebration overlay
  if (matchFound) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg-dark/95">
        <div className="text-center animate-pulse-glow rounded-3xl p-8">
          <div className="text-6xl mb-4">🎬</div>
          <h1 className="text-4xl font-bold text-white mb-2">It&apos;s a Match!</h1>
          <p className="text-xl text-primary font-semibold">{matchFound}</p>
          <p className="text-slate-400 mt-2">You both swiped right!</p>
        </div>
      </div>
    )
  }

  if (!currentMovie) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🍿</div>
          <h2 className="text-2xl font-bold text-white mb-2">All Done!</h2>
          <p className="text-slate-400 mb-6">You&apos;ve swiped through all movies</p>
          <button
            onClick={() => router.push('/session/match')}
            className="h-14 px-8 bg-primary hover:bg-primary/90 rounded-full text-white font-bold shadow-lg shadow-primary/25"
          >
            See Results
          </button>
        </div>
      </div>
    )
  }

  const posterUrl = currentMovie.poster_path
    ? `https://image.tmdb.org/t/p/w500${currentMovie.poster_path}`
    : null
  const matchPercent = Math.round(currentMovie.match_score * 100)

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex-none px-6 pt-6 pb-4 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-full p-2 hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
          <span className="text-sm font-bold text-slate-400">
            {remaining} movie{remaining !== 1 ? 's' : ''} left
          </span>
          <div className="w-9" />
        </div>
      </header>

      {/* Swipe card area */}
      <main className="flex-1 flex items-center justify-center px-6 pb-6">
        <div
          ref={cardRef}
          className={`relative w-full max-w-sm rounded-2xl overflow-hidden bg-surface-dark shadow-2xl transition-transform duration-300 ${
            swipeDirection === 'right' ? 'animate-swipe-right' : ''
          } ${swipeDirection === 'left' ? 'animate-swipe-left' : ''}`}
        >
          {/* Poster */}
          <div className="relative h-80 w-full bg-gray-800">
            {posterUrl ? (
              <Image
                src={posterUrl}
                alt={currentMovie.title}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex items-center justify-center h-full text-4xl">🎬</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-dark to-transparent" />
            {/* Match badge */}
            <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg border border-white/10 z-10">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {matchPercent}% Match
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <h2 className="text-2xl font-bold text-white mb-1">{currentMovie.title}</h2>
            <div className="flex items-center gap-3 text-sm text-gray-400 mb-3 font-medium">
              <span>{currentMovie.release_year}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600" />
              <span>★ {currentMovie.vote_average.toFixed(1)}</span>
            </div>
            <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
              {currentMovie.overview}
            </p>
          </div>
        </div>
      </main>

      {/* Swipe buttons */}
      <div className="flex-none px-6 pb-8 flex items-center justify-center gap-8">
        <button
          onClick={() => handleSwipe('left')}
          className="w-16 h-16 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 flex items-center justify-center transition-all active:scale-90"
        >
          <svg className="w-7 h-7 text-red-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary hover:bg-primary/30 flex items-center justify-center transition-all active:scale-90 glow-primary"
        >
          <svg className="w-9 h-9 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
