import { redirect } from 'next/navigation'
import { getActiveSession, getQuestions } from '@/actions/session'
import { QuizClient } from '@/components/quiz-client'
import { getProfile } from '@/actions/auth'

export default async function QuizPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const session = await getActiveSession()
  if (!session) redirect('/dashboard')

  const { questions } = await getQuestions()
  if (!questions) redirect('/dashboard')

  return (
    <QuizClient
      session={session}
      questions={questions}
      userId={profile.id}
    />
  )
}
