import { getProfile } from '@/actions/auth'
import { getActiveCouple } from '@/actions/couple'
import { getActiveSession } from '@/actions/session'
import { DashboardClient } from '@/components/dashboard-client'
import { ForceLogout } from '@/components/force-logout'

export default async function DashboardPage() {
  const profile = await getProfile()
  if (!profile) {
    return <ForceLogout />
  }

  const couple = await getActiveCouple()
  const session = await getActiveSession()

  return (
    <DashboardClient
      profile={profile}
      couple={couple}
      activeSession={session}
    />
  )
}
