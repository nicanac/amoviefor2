'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { submitAnswer, checkBothAnsweredQuestion, checkBothAnswered, generateMovieRecommendations, getActiveSession } from '@/actions/session'

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
  sessionId: string
  sessionStatus: string
  questions: Question[]
}

export function QuizClient({ sessionId, sessionStatus, questions }: QuizClientProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedValues, setSelectedValues] = useState<Record<number, unknown>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isWaitingForPartner, setIsWaitingForPartner] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Waiting for your partner...')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isPollingRef = useRef(false)

  // Polls until the session reaches 'completed' status, then redirects
  const waitForMatchCompletion = useCallback(async () => {
    setIsGenerating(true)
    setStatusMessage('Your partner is generating recommendations...')

    const pollCompletion = async (): Promise<boolean> => {
      const session = await getActiveSession()
      if (!session) {
        // No active session means it's already completed
        router.push('/session/match')
        return true
      }
      if (session.status === 'completed') {
        router.push('/session/match')
        return true
      }
      return false
    }

    // Check immediately
    if (await pollCompletion()) return

    // Poll every 2s
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      if (await pollCompletion()) {
        clearInterval(interval)
        return
      }
      if (attempts >= 30) {
        clearInterval(interval)
        setIsGenerating(false)
        setError('Recommendation generation is taking too long. Please refresh.')
      }
    }, 2000)
  }, [router])

  // Handles calling generate and dealing with all possible responses
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    setStatusMessage('Generating recommendations...')

    const genResult = await generateMovieRecommendations(sessionId)
    if (genResult.error) {
      setIsGenerating(false)
      setError(genResult.error)
      return
    }

    if ('inProgress' in genResult && genResult.inProgress) {
      // Another user is already generating - wait for completion
      await waitForMatchCompletion()
      return
    }

    // alreadyGenerated or success
    router.push('/session/match')
  }, [sessionId, router, waitForMatchCompletion])

  const currentQuestion = questions[currentIndex]
  const currentOptions = (currentQuestion?.options ?? []) as QuestionOption[]
  const isLastQuestion = currentIndex === questions.length - 1
  const progress = ((currentIndex + 1) / questions.length) * 100

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    isPollingRef.current = false
  }, [])

  useEffect(() => {
    if (sessionStatus === 'swiping' || sessionStatus === 'completed') {
      router.push('/session/match')
    } else if (sessionStatus === 'matching') {
      waitForMatchCompletion()
    }
  }, [sessionStatus, router, waitForMatchCompletion])

  // Polling effect: waits for partner to answer the current question
  useEffect(() => {
    if (!isWaitingForPartner || isPollingRef.current) return

    isPollingRef.current = true
    const countRef = { current: 0 }

    const poll = async () => {
      try {
        if (isLastQuestion) {
          // On last question, check if both users finished ALL questions
          const status = await checkBothAnswered(sessionId)

          if ('error' in status) {
            stopPolling()
            setIsWaitingForPartner(false)
            setError(status.error as string)
            return
          }

          if (status.bothDone) {
            stopPolling()
            setIsWaitingForPartner(false)
            await handleGenerate()
            return
          }
        } else {
          // For non-last questions, check if partner answered THIS question
          const result = await checkBothAnsweredQuestion(sessionId, currentQuestion.id)

          if ('error' in result) {
            stopPolling()
            setIsWaitingForPartner(false)
            setError(result.error as string)
            return
          }

          if (result.partnerAnswered) {
            stopPolling()
            setIsWaitingForPartner(false)
            setCurrentIndex(prev => prev + 1)
            return
          }
        }

        countRef.current += 1
        if (countRef.current >= 60) {
          stopPolling()
          setIsWaitingForPartner(false)
          setError('Partner is taking too long. Please refresh.')
        }
      } catch (err) {
        stopPolling()
        setIsWaitingForPartner(false)
        setError('Connection error. Please refresh.')
        console.error(err)
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 2000)

    return stopPolling
  }, [isWaitingForPartner, sessionId, currentQuestion?.id, isLastQuestion, router, stopPolling, handleGenerate])

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
    setError(null)

    try {
      const result = await submitAnswer(
        sessionId,
        currentQuestion.id,
        selectedValues[currentQuestion.id]
      )

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // After submitting, check if partner already answered this question
      if (isLastQuestion) {
        const status = await checkBothAnswered(sessionId)
        if (status.bothDone) {
          await handleGenerate()
        } else {
          setStatusMessage('Waiting for your partner to finish...')
          setIsWaitingForPartner(true)
        }
      } else {
        const check = await checkBothAnsweredQuestion(sessionId, currentQuestion.id)
        if (check.partnerAnswered) {
          setCurrentIndex(prev => prev + 1)
        } else {
          setStatusMessage('Waiting for your partner...')
          setIsWaitingForPartner(true)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }

    setLoading(false)
  }

  if (!currentQuestion) return null

  return (
    <div className="flex flex-col h-screen bg-bg-dark">
      <header className="flex-none px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-400">
            {currentIndex + 1}/{questions.length}
          </span>
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}
      </header>

      <main className="flex-1 flex flex-col px-4 py-4 overflow-y-auto">
        <h1 className="text-xl font-semibold text-white mb-6">
          {currentQuestion.text}
        </h1>

        {(isWaitingForPartner || isGenerating) ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-primary mb-2 font-medium">{statusMessage}</p>
            <p className="text-xs text-slate-500">
              {isGenerating ? 'Finding the best movies for you...' : 'Your partner is still answering this question'}
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              {currentOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${isSelected(option.value)
                    ? 'bg-primary/30 border-primary'
                    : 'bg-white/5 border-transparent hover:bg-white/10'
                    }`}
                >
                  {option.emoji && (
                    <span className="text-2xl">{option.emoji}</span>
                  )}
                  <span className={`text-sm font-medium ${isSelected(option.value) ? 'text-white' : 'text-slate-300'
                    }`}>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={handleNext}
              disabled={!hasSelection() || loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors mb-4"
            >
              {loading ? '...' : isLastQuestion ? 'Find Matches' : 'Next'}
            </button>
          </>
        )}
      </main>
    </div>
  )
}
