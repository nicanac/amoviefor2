import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getActiveSession, getSessionMovies, getLastCompletedSession } from '@/actions/session'
import { MatchResultClient } from '@/components/match-result-client'
import { ForceLogout } from '@/components/force-logout'

export default async function MatchPage() {
  const profile = await getProfile()
  if (!profile) {
    return <ForceLogout />
  }

  let session = await getActiveSession()
  // Also check for most recent completed session if no active one
  if (!session) {
    session = await getLastCompletedSession()
  }

  if (!session) redirect('/dashboard')

  // With swiping disabled, just show all generated movies as "matches"/results
  // const matches = await getSessionMatches(session.id)
  const movies = await getSessionMovies(session.id)

  const results = movies.map(raw => ({
    id: raw.id, // Using the movie ID as match ID for UI uniqueness
    session_id: session.id,
    session_movie_id: raw.id,
    matched_at: new Date().toISOString(), // Mock matched time
    movie: {
      id: raw.id,
      tmdb_id: raw.tmdb_id,
      title: raw.title,
      poster_path: raw.poster_path,
      overview: raw.overview,
      release_year: raw.release_year,
      genres: (raw.genres ?? []) as string[],
      vote_average: raw.vote_average,
      match_score: raw.match_score,
      rank: raw.rank,
    }
  }))

  return (
    <MatchResultClient
      matches={results}
      sessionId={session.id}
      coupleId={session.couple_id}
    />
  )
}
