import { redirect } from 'next/navigation'
import { getProfile, logout } from '@/actions/auth'
import { getMatchHistory } from '@/actions/movies'
import { HistoryClient } from '@/components/history-client'

export default async function HistoryPage() {
  const profile = await getProfile()
  if (!profile) {
    await logout()
    redirect('/login')
  }

  const matches = await getMatchHistory()

  return <HistoryClient matches={matches} />
}
