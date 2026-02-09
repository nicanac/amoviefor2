import { redirect } from 'next/navigation'
import { getProfile, logout } from '@/actions/auth'
import { getActiveCouple } from '@/actions/couple'
import { InviteClient } from '@/components/invite-client'

export default async function InvitePage() {
  const profile = await getProfile()
  if (!profile) {
    await logout()
    redirect('/login')
  }

  const couple = await getActiveCouple()

  return <InviteClient profile={profile} couple={couple} />
}
