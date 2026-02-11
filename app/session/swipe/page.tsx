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
  
  // If still answering, go to questions
  if (session.status === 'answering') redirect('/session/questions')
  
  // If matching, show waiting state (don't create loop)
  if (session.status === 'matching') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="animate-pulse text-primary text-xl">Generating movie recommendations...</div>
        <p className="text-slate-400 mt-2">This may take a few seconds</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary/20 rounded-lg text-primary hover:bg-primary/30"
        >
          Refresh
        </button>
      </div>
    )
  }

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
    />
  )
}
