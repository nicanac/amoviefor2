import { redirect } from 'next/navigation'
import { getActiveSession, getQuestions } from '@/actions/session'
import { QuizClient } from '@/components/quiz-client'
import { getProfile } from '@/actions/auth'
import { ForceLogout } from '@/components/force-logout'

export default async function QuizPage() {
  const profile = await getProfile()
  if (!profile) {
    return <ForceLogout />
  }

  const session = await getActiveSession()
  if (!session) redirect('/dashboard')

  // If session already completed, go to match results
  if (session.status === 'completed') redirect('/session/match')
  if (session.status === 'swiping') redirect('/session/match')

  // For 'answering' and 'matching', render the client component
  // The client component handles the 'matching' state with polling
  const { questions } = await getQuestions()
  if (!questions) redirect('/dashboard')

  return (
    <QuizClient
      sessionId={session.id}
      sessionStatus={session.status}
      questions={questions}
    />
  )
}
