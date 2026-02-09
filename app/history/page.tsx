import { redirect } from 'next/navigation'
import { getProfile } from '@/actions/auth'
import { getMatchHistory } from '@/actions/movies'
import { HistoryClient } from '@/components/history-client'

export default async function HistoryPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const matches = await getMatchHistory()

  return <HistoryClient matches={matches} />
}
