import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getActiveSession, getSessionMovies } from '@/actions/session'
import { getSessionMatches } from '@/actions/swipe'
import { MatchResultClient } from '@/components/match-result-client'
import { ForceLogout } from '@/components/force-logout'

export default async function MatchPage() {
  const profile = await getProfile()
  if (!profile) {
    return <ForceLogout />
  }

  const session = await getActiveSession()
  // Also check for most recent completed session
  if (!session) redirect('/dashboard')

  const matches = await getSessionMatches(session.id)
  const movies = await getSessionMovies(session.id)

  // Get matched movies with full data
  const matchedMovies = matches.map(match => {
    const raw = movies.find(m => m.id === match.session_movie_id)
    if (!raw) return { ...match, movie: undefined }
    const movie = {
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
    return { ...match, movie }
  }).filter(m => m.movie)

  return (
    <MatchResultClient
      matches={matchedMovies}
      sessionId={session.id}
    />
  )
}
