'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { submitAnswer, checkBothAnswered, generateMovieRecommendations } from '@/actions/session'

interface Question {
  id: number
  text: string
  type: string
  category: string
  options: unknown
  order: number
  weight: number
}

interface QuestionOption {
  value: string
  label: string
  emoji?: string
  tmdb_genre_id?: number
}

interface QuizClientProps {
  session: { id: string; status: string }
  questions: Question[]
  userId: string
}

export function QuizClient({ session, questions, userId }: QuizClientProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedValues, setSelectedValues] = useState<Record<number, unknown>>({})

  const currentQuestion = questions[currentIndex]
  const currentOptions = (currentQuestion?.options ?? []) as QuestionOption[]
  const [loading, setLoading] = useState(false)
  const [waitingForPartner, setWaitingForPartner] = useState(false)
  const [timer] = useState(45)

  const isLastQuestion = currentIndex === questions.length - 1
  const progress = ((currentIndex + 1) / questions.length) * 100

  const handleSelect = useCallback((value: string) => {
    if (!currentQuestion) return

    if (currentQuestion.type === 'multi_choice') {
      const current = (selectedValues[currentQuestion.id] as string[]) || []
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value]
      setSelectedValues(prev => ({ ...prev, [currentQuestion.id]: updated }))
    } else {
      setSelectedValues(prev => ({ ...prev, [currentQuestion.id]: value }))
    }
  }, [currentQuestion, selectedValues])

  const isSelected = (value: string): boolean => {
    if (!currentQuestion) return false
    const sel = selectedValues[currentQuestion.id]
    if (Array.isArray(sel)) return sel.includes(value)
    return sel === value
  }

  const hasSelection = (): boolean => {
    if (!currentQuestion) return false
    const sel = selectedValues[currentQuestion.id]
    if (Array.isArray(sel)) return sel.length > 0
    return sel !== undefined && sel !== null
  }

  async function handleNext() {
    if (!currentQuestion || !hasSelection()) return
    setLoading(true)

    // Submit the answer
    await submitAnswer(
      session.id,
      currentQuestion.id,
      selectedValues[currentQuestion.id]
    )

    if (isLastQuestion) {
      // Check if both partners are done
      setWaitingForPartner(true)
      const status = await checkBothAnswered(session.id)

      if (status.bothDone) {
        // Trigger matching engine
        await generateMovieRecommendations(session.id)
        router.push('/session/swipe')
      } else {
        // Poll for partner completion
        pollForPartner()
      }
    } else {
      setCurrentIndex(prev => prev + 1)
    }

    setLoading(false)
  }

  async function pollForPartner() {
    const interval = setInterval(async () => {
      const status = await checkBothAnswered(session.id)
      if (status.bothDone) {
        clearInterval(interval)
        await generateMovieRecommendations(session.id)
        router.push('/session/swipe')
      }
    }, 3000)

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(interval), 300000)
  }

  if (!currentQuestion) return null

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header with timer + progress */}
      <header className="flex-none px-6 pt-6 pb-2 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
            </svg>
            <span className="text-sm font-bold tracking-wider text-slate-400">
              {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="rounded-full p-2 hover:bg-white/5 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full shadow-[0_0_12px_rgba(140,43,238,0.6)] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col relative">
        {/* Central question card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-full px-4 pointer-events-none">
          <div className="bg-card-dark/90 backdrop-blur-md border border-white/10 shadow-xl rounded-2xl py-3 px-6 text-center">
            <h1 className="text-2xl font-bold text-white leading-tight">
              {currentQuestion.text}
            </h1>
            <p className="text-xs font-medium text-slate-400 mt-1 uppercase tracking-widest">
              Question {currentIndex + 1}/{questions.length}
            </p>
          </div>
        </div>

        {/* Single player zone (since we handle partner independently) */}
        <section className="flex-1 bg-zone-bottom relative flex flex-col justify-center p-6">
          {waitingForPartner ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
              <p className="text-primary font-medium text-sm animate-pulse">
                Waiting for your partner to finish...
              </p>
              <p className="text-xs text-slate-500">This shouldn&apos;t take long</p>
            </div>
          ) : (
            <>
              {/* Options grid */}
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full mt-16">
                {currentOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleSelect(option.value)}
                    className={`group relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 active:scale-95 transition-all shadow-sm h-32 ${
                      isSelected(option.value)
                        ? 'bg-primary border-primary glow-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-zone-bottom'
                        : 'bg-card-darker border-transparent hover:border-primary/50'
                    }`}
                  >
                    {isSelected(option.value) && (
                      <div className="absolute top-2 right-2 bg-white/20 rounded-full p-0.5">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </div>
                    )}
                    {option.emoji && (
                      <div className="text-3xl filter drop-shadow-md">{option.emoji}</div>
                    )}
                    <span className={`text-sm font-bold transition-colors ${
                      isSelected(option.value) ? 'text-white' : 'text-slate-200 group-hover:text-primary'
                    }`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Next button */}
              <div className="mt-8 max-w-sm mx-auto w-full">
                <button
                  onClick={handleNext}
                  disabled={!hasSelection() || loading}
                  className="w-full h-14 bg-primary hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all rounded-full text-white font-bold text-base shadow-lg shadow-primary/25"
                >
                  {loading ? (
                    <span className="animate-pulse">Processing...</span>
                  ) : isLastQuestion ? (
                    'Find Matches'
                  ) : (
                    'Next'
                  )}
                </button>
              </div>
            </>
          )}
        </section>
      </main>

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
    </div>
  )
}
