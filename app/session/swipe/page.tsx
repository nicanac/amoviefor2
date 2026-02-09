import { redirect } from 'next/navigation'
import { getActiveSession, getSessionMovies } from '@/actions/session'
import { getUserSwipes } from '@/actions/swipe'
import { getProfile } from '@/actions/auth'
import { SwipeClient } from '@/components/swipe-client'
import { ForceLogout } from '@/components/force-logout'

export default async function SwipePage() {
  const profile = await getProfile()
  if (!profile) {
    return <ForceLogout />
  }

  const session = await getActiveSession()
  if (!session) redirect('/dashboard')
  if (session.status !== 'swiping') redirect('/session/questions')

  const movies = await getSessionMovies(session.id)
  const swipes = await getUserSwipes(session.id)

  const swipedMovieIds = new Set(swipes.map(s => s.session_movie_id))
  const unswipedMovies = movies
    .filter(m => !swipedMovieIds.has(m.id))
    .map(m => ({ ...m, genres: (m.genres ?? []) as string[] }))

  return (
    <SwipeClient
      session={session}
      movies={unswipedMovies}
      userId={profile.id}
    />
  )
}
