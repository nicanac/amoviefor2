'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { quickConnect } from '@/actions/couple'

interface Profile {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
}

interface ProfileClientProps {
    profile: Profile | null
    initialPartners: Profile[]
}

export default function ProfileClient({ profile, initialPartners }: ProfileClientProps) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<string | null>(null)

    if (!profile) return <div>Loading...</div>

    const name = profile.full_name || profile.username || 'User'
    const initial = name[0]?.toUpperCase() || 'U'

    async function handleQuickConnect(partnerId: string) {
        setLoadingId(partnerId)
        try {
            const res = await quickConnect(partnerId)
            if (res && res.error) {
                alert(res.error)
            } else {
                // Success
                router.push('/dashboard')
            }
        } catch (err) {
            console.error(err)
            alert('Failed to connect')
        } finally {
            setLoadingId(null)
        }
    }

    return (
        <div className="max-w-md mx-auto pt-8">
            {/* Header */}
            <div className="flex items-center mb-8">
                <Link href="/dashboard" className="mr-4 p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </Link>
                <h1 className="text-2xl font-bold text-white">Profile</h1>
            </div>

            {/* Profile Card */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-8 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/20 overflow-hidden relative mb-4">
                    {profile.avatar_url ? (
                        <Image
                            src={profile.avatar_url}
                            alt={name}
                            fill
                            className="object-cover"
                            sizes="96px"
                        />
                    ) : (
                        <span className="text-primary font-bold text-3xl">{initial}</span>
                    )}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{name}</h2>
                <p className="text-slate-400 text-sm">@{profile.username || 'username'}</p>
            </div>

            {/* Recent Partners */}
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                    </svg>
                    Recent Partners
                </h3>

                {initialPartners.length === 0 ? (
                    <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                        <p className="text-slate-400">No recent partners found.</p>
                        <Link href="/invite" className="text-primary text-sm hover:underline mt-2 inline-block">
                            Invite a partner
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {initialPartners.map(partner => (
                            <div key={partner.id} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden relative border border-white/10">
                                        {partner.avatar_url ? (
                                            <Image src={partner.avatar_url} alt={partner.full_name || 'Partner'} fill className="object-cover" sizes="40px" />
                                        ) : (
                                            <span className="text-slate-400 font-bold text-xs">{(partner.full_name || partner.username || '?')[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-white font-medium text-sm">{partner.full_name || partner.username || 'Unknown'}</p>
                                        <p className="text-slate-500 text-xs">@{partner.username}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleQuickConnect(partner.id)}
                                    disabled={!!loadingId}
                                    className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg border border-primary/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {loadingId === partner.id ? 'Connecting...' : 'Connect'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="text-center mt-12">
                <Link href="/dashboard" className="text-slate-500 text-sm hover:text-white transition-colors">
                    Back to Dashboard
                </Link>
            </div>
        </div>
    )
}
