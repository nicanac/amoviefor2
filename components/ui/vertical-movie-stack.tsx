"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { motion, type PanInfo } from "motion/react"
import Image from "next/image"
import { ChevronUp, ChevronDown, Heart, Star, Calendar } from "lucide-react"

interface Movie {
  id: string
  tmdb_id: number
  title: string
  poster_path: string | null
  overview: string
  release_year: number
  genres: string[]
  vote_average: number
  match_score: number
  rank: number
}

interface VerticalMovieStackProps {
  movies: Movie[]
  onMovieSelect?: (movie: Movie) => void
}

export function VerticalMovieStack({ movies, onMovieSelect }: VerticalMovieStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const lastNavigationTime = useRef(0)
  const navigationCooldown = 400 // ms between navigations

  const navigate = useCallback((newDirection: number) => {
    const now = Date.now()
    if (now - lastNavigationTime.current < navigationCooldown) return
    lastNavigationTime.current = now

    setCurrentIndex((prev) => {
      if (newDirection > 0) {
        return prev === movies.length - 1 ? 0 : prev + 1
      }
      return prev === 0 ? movies.length - 1 : prev - 1
    })
  }, [movies.length])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50
    if (info.offset.y < -threshold) {
      navigate(1)
    } else if (info.offset.y > threshold) {
      navigate(-1)
    }
  }

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 30) {
        if (e.deltaY > 0) {
          navigate(1)
        } else {
          navigate(-1)
        }
      }
    },
    [navigate],
  )

  useEffect(() => {
    window.addEventListener("wheel", handleWheel, { passive: true })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  const getCardStyle = (index: number) => {
    const total = movies.length
    let diff = index - currentIndex
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total

    if (diff === 0) {
      return { y: 0, scale: 1, opacity: 1, zIndex: 5, rotateX: 0 }
    } else if (diff === -1) {
      return { y: -140, scale: 0.85, opacity: 0.6, zIndex: 4, rotateX: 8 }
    } else if (diff === -2) {
      return { y: -240, scale: 0.72, opacity: 0.3, zIndex: 3, rotateX: 15 }
    } else if (diff === 1) {
      return { y: 140, scale: 0.85, opacity: 0.6, zIndex: 4, rotateX: -8 }
    } else if (diff === 2) {
      return { y: 240, scale: 0.72, opacity: 0.3, zIndex: 3, rotateX: -15 }
    } else {
      return { y: diff > 0 ? 350 : -350, scale: 0.6, opacity: 0, zIndex: 0, rotateX: diff > 0 ? -20 : 20 }
    }
  }

  const isVisible = (index: number) => {
    const total = movies.length
    let diff = index - currentIndex
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total
    return Math.abs(diff) <= 2
  }

  const currentMovie = movies[currentIndex]

  if (movies.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="text-gray-400">No movies to display</p>
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Card Stack */}
      <div className="relative flex h-[480px] w-[280px] items-center justify-center" style={{ perspective: "1200px" }}>
        {movies.map((movie, index) => {
          if (!isVisible(index)) return null
          const style = getCardStyle(index)
          const isCurrent = index === currentIndex
          const posterUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : null
          const matchPercent = Math.round(movie.match_score * 100)

          return (
            <motion.div
              key={movie.id}
              className="absolute cursor-grab active:cursor-grabbing"
              animate={{
                y: style.y,
                scale: style.scale,
                opacity: style.opacity,
                rotateX: style.rotateX,
                zIndex: style.zIndex,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 1,
              }}
              drag={isCurrent ? "y" : false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              onClick={() => isCurrent && onMovieSelect?.(movie)}
              style={{
                transformStyle: "preserve-3d",
                zIndex: style.zIndex,
              }}
            >
              <div
                className="relative h-[420px] w-[280px] overflow-hidden rounded-3xl bg-surface-dark ring-1 ring-white/10"
                style={{
                  boxShadow: isCurrent
                    ? "0 25px 50px -12px rgba(140, 43, 238, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05)"
                    : "0 10px 30px -10px rgba(0, 0, 0, 0.4)",
                }}
              >
                {/* Card inner glow */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 via-transparent to-transparent" />

                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    draggable={false}
                    priority={isCurrent}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-card-dark text-6xl">
                    🎬
                  </div>
                )}

                {/* Bottom gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

                {/* Match badge */}
                {isCurrent && (
                  <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg border border-white/10 z-10">
                    <Heart className="w-3.5 h-3.5 mr-1 fill-current" />
                    {matchPercent}%
                  </div>
                )}

                {/* Movie info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                  <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 leading-tight">
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-300">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {movie.release_year}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      {movie.vote_average.toFixed(1)}
                    </span>
                  </div>
                  {movie.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {movie.genres.slice(0, 3).map((genre) => (
                        <span
                          key={genre}
                          className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Navigation dots */}
      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 flex-col gap-2">
        {movies.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (index !== currentIndex) {
                setCurrentIndex(index)
              }
            }}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? "h-6 bg-primary" : "bg-white/30 hover:bg-white/50"
            }`}
            aria-label={`Go to movie ${index + 1}`}
          />
        ))}
      </div>

      {/* Instruction hint */}
      <motion.div
        className="absolute bottom-4 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <div className="flex flex-col items-center gap-1.5 text-gray-400">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronUp className="w-5 h-5" />
          </motion.div>
          <span className="text-xs font-medium tracking-widest uppercase">Swipe or scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          >
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </div>
      </motion.div>

      {/* Counter */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-light text-white tabular-nums">
            {String(currentIndex + 1).padStart(2, "0")}
          </span>
          <div className="my-1.5 h-px w-6 bg-white/20" />
          <span className="text-sm text-gray-400 tabular-nums">{String(movies.length).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Current movie details (below card) */}
      {currentMovie && (
        <motion.div
          key={currentMovie.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center max-w-[280px]"
        >
          <p className="text-xs text-gray-400 line-clamp-2">{currentMovie.overview}</p>
          <button
            onClick={() => onMovieSelect?.(currentMovie)}
            className="mt-3 text-primary text-sm font-medium hover:underline"
          >
            View Details →
          </button>
        </motion.div>
      )}
    </div>
  )
}
