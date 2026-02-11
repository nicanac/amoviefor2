import { getProfile } from '@/actions/auth'
import { getSessionHistory } from '@/actions/session'
import { HistoryClient } from '@/components/history-client'
import { ForceLogout } from '@/components/force-logout'

export default async function HistoryPage() {
  const profile = await getProfile()
  if (!profile) {
    return <ForceLogout />
  }

  const sessions = await getSessionHistory()

  return <HistoryClient sessions={sessions} />
}
