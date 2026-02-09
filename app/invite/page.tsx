import { getProfile } from '@/actions/auth'
import { getActiveCouple } from '@/actions/couple'
import { InviteClient } from '@/components/invite-client'
import { ForceLogout } from '@/components/force-logout'

export default async function InvitePage() {
  const profile = await getProfile()
  if (!profile) {
    return <ForceLogout />
  }

  const couple = await getActiveCouple()

  return <InviteClient profile={profile} couple={couple} />
}
