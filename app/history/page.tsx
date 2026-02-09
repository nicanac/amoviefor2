import { getProfile } from '@/actions/auth'
import { getMatchHistory } from '@/actions/movies'
import { HistoryClient } from '@/components/history-client'
import { ForceLogout } from '@/components/force-logout'

export default async function HistoryPage() {
  const profile = await getProfile()
  if (!profile) {
    return <ForceLogout />
  }

  const matches = await getMatchHistory()

  return <HistoryClient matches={matches} />
}
