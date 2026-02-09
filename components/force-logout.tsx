'use client'

import { useEffect } from 'react'
import { logout } from '@/actions/auth'

export function ForceLogout() {
  useEffect(() => {
    async function doLogout() {
      await logout()
    }
    doLogout()
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400">Signing out...</p>
      </div>
    </div>
  )
}
