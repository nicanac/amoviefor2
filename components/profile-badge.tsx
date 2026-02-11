'use client'

import Link from 'next/link'
import Image from 'next/image'

interface Profile {
    username: string | null
    full_name: string | null
    avatar_url: string | null
}

interface ProfileBadgeProps {
    profile: Profile
}

export function ProfileBadge({ profile }: ProfileBadgeProps) {
    const name = profile.full_name || profile.username || 'User'
    const initial = name[0]?.toUpperCase() || 'U'

    return (
        <Link
            href="/profile"
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 transition-colors backdrop-blur-md pl-1.5 pr-3 py-1.5 rounded-full border border-white/10 group"
        >
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 overflow-hidden relative shrink-0">
                {profile.avatar_url ? (
                    <Image
                        src={profile.avatar_url}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="32px"
                    />
                ) : (
                    <span className="text-primary font-bold text-[10px]">{initial}</span>
                )}
            </div>
            <span className="text-sm font-medium text-white max-w-[100px] truncate group-hover:text-primary transition-colors">
                {name}
            </span>
        </Link>
    )
}
