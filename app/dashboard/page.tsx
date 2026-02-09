import { redirect } from 'next/navigation'
import { getProfile, logout } from '@/actions/auth'
import { getActiveCouple } from '@/actions/couple'
import { getActiveSession } from '@/actions/session'
import { DashboardClient } from '@/components/dashboard-client'

export default async function DashboardPage() {
  const profile = await getProfile()
  if (!profile) {
    await logout()
    redirect('/login')
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
