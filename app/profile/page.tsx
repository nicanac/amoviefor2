import { getProfile } from '@/actions/auth'
import { getRecentPartners } from '@/actions/couple'
import ProfileClient from '@/components/profile-client'

export default async function ProfilePage() {
    const profile = await getProfile()
    const partners = await getRecentPartners()

    return (
        <div className="min-h-screen bg-bg-dark text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 z-0 bg-pattern pointer-events-none opacity-50" />
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none z-0" />

            <div className="relative z-10">
                <ProfileClient profile={profile} initialPartners={partners} />
            </div>
        </div>
    )
}
