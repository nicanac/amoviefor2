import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between overflow-hidden selection:bg-primary selection:text-white">
      {/* Background decoration */}
      <div className="absolute inset-0 z-0 bg-pattern pointer-events-none" />
      {/* Top gradient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col h-full min-h-screen max-w-md mx-auto w-full px-6 pt-8 pb-10">
        {/* Header / Logo */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
            <span className="text-sm font-bold tracking-wide uppercase text-white/80">
              MatchCut
            </span>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="flex-1 flex flex-col justify-center items-center py-8">
          <div className="relative w-full aspect-square max-w-[320px] mx-auto mb-8 group">
            {/* Film reel circle */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30 animate-spin-slow" />
            <div className="absolute inset-4 rounded-full border border-white/5 bg-white/5 backdrop-blur-sm" />
            {/* Main image */}
            <div className="absolute inset-6 rounded-full overflow-hidden shadow-2xl shadow-primary/20 border-4 border-bg-dark">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsSQ25i0z04APKSwT_iMqWRaPl5bawsGfa7_qoDZQ-SqGUU6WpaT2m3IGtqwtl2hbTgN5GJeeSTFNCNjXubutZ2D10LLxgjl4eXQN0X24J0U4EAHXdm2qxZZ_VuD8oWJtwBO4qUKaV9N_xrQ98ZXaIWUkemrUBnb-BAOI9uHGBSky2KQYWBPwMhbxxiZjiAsJN6Dj7r-_HoT25saO4SVvpHnCNQehnLmFn903ER6MXcp66-QK5V5fGfJMlwP9BW6usZDApi4DNhHML"
                alt="Couple eating popcorn in dark movie theater atmosphere"
                fill
                className="object-cover opacity-90"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent opacity-60" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-2 -right-2 bg-bg-dark rounded-2xl p-2 shadow-xl border border-white/10 flex items-center gap-3 pr-4">
              <div className="bg-primary/20 p-2 rounded-xl text-primary">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-white/60 font-medium">Match Rate</span>
                <span className="text-sm font-bold text-white">98%</span>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-4 text-center mt-4">
            <h1 className="text-4xl leading-[1.1] font-bold text-white tracking-tight">
              Find your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
                perfect movie
              </span>{' '}
              in 60 seconds.
            </h1>
            <p className="text-lg text-slate-300 font-medium leading-relaxed max-w-[300px] mx-auto">
              Swipe, match, and watch. <br />
              No more arguments.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4 w-full mt-auto">
          {/* Host Button */}
          <Link
            href="/signup"
            className="group relative w-full flex items-center justify-between bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 h-16 px-2 rounded-full overflow-hidden shadow-lg shadow-primary/25"
          >
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center ml-1">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" />
              </svg>
            </div>
            <span className="text-white text-lg font-bold tracking-wide mr-auto pl-4">
              Host a Session
            </span>
            <div className="pr-6 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
              </svg>
            </div>
          </Link>

          {/* Join + Settings */}
          <div className="flex gap-3">
            <Link
              href="/login"
              className="flex-1 h-14 bg-[#362348] hover:bg-[#442c5a] active:scale-[0.98] transition-all rounded-full text-white font-bold text-base border border-white/5 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M22 9V7h-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2v-2h-2V9h2zM14 19H4V5h10v14zm4-8h-2v2h2v-2z" />
              </svg>
              Join Session
            </Link>
            <button
              aria-label="Settings"
              className="h-14 w-14 aspect-square rounded-full bg-bg-dark border border-white/10 hover:bg-white/5 flex items-center justify-center active:scale-95 transition-all"
            >
              <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>
          </div>

          {/* Footer link */}
          <div className="pt-4 text-center">
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
    </div>
  )
}
