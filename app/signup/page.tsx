'use client'

import Link from 'next/link'
import { signup } from '@/actions/auth'
import { useActionState } from 'react'

function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-slate-300 mb-2">
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          className="w-full h-14 px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          placeholder="Alex & Jordan"
        />
      </div>
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          className="w-full h-14 px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          placeholder="movielover42"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full h-14 px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full h-14 px-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full h-14 bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all rounded-full text-white font-bold text-base shadow-lg shadow-primary/25 disabled:opacity-50"
      >
        {pending ? 'Creating account...' : 'Create Account'}
      </button>
    </form>
  )
}

export default function SignupPage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-pattern pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col min-h-screen max-w-md mx-auto w-full px-6 pt-8 pb-10">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
            <span className="text-sm font-bold tracking-wide uppercase text-white/80">MatchCut</span>
          </Link>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create an account</h1>
          <p className="text-slate-400">Start finding movies you&apos;ll both love</p>
        </div>

        {/* Form */}
        <SignupForm />

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary hover:text-primary/80 font-semibold underline decoration-2 underline-offset-2 transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
