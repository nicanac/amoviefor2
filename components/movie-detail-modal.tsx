'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface MovieDetailModalProps {
  tmdbId: number
  title: string
  posterPath: string
  matchScore: number
  onClose: () => void
}

interface MovieDetail {
  title: string
  tagline: string
  overview: string
  release_date: string
  runtime: number | null
  vote_average: number
  vote_count: number
  genres: { id: number; name: string }[]
  backdrop_path: string | null
  poster_path: string | null
  spoken_languages: { english_name: string }[]
  production_companies: { name: string }[]
  budget: number
  revenue: number
  trailerKey: string | null
}

interface WatchProvider {
  provider_id: number
  provider_name: string
  logo_path: string | null
}

interface WatchProvidersData {
  flatrate?: WatchProvider[]
  rent?: WatchProvider[]
  buy?: WatchProvider[]
  free?: WatchProvider[]
  link?: string
}

export function MovieDetailModal({ tmdbId, title, posterPath, matchScore, onClose }: MovieDetailModalProps) {
  const [detail, setDetail] = useState<MovieDetail | null>(null)
  const [providers, setProviders] = useState<WatchProvidersData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTrailer, setShowTrailer] = useState(false)

  useEffect(() => {
    async function fetchDetail() {
      try {
        const [detailRes, providersRes] = await Promise.all([
          fetch(`/api/tmdb?action=detail&id=${tmdbId}`),
          fetch(`/api/tmdb?action=providers&id=${tmdbId}`),
        ])
        
        if (!detailRes.ok) throw new Error('Failed to fetch movie details')
        const data = await detailRes.json()

        // Find YouTube trailer
        const videos = data.videos?.results || []
        const trailer = videos.find(
          (v: { site: string; type: string }) => v.site === 'YouTube' && v.type === 'Trailer'
        ) || videos.find(
          (v: { site: string }) => v.site === 'YouTube'
        )

        setDetail({
          ...data,
          trailerKey: trailer?.key || null,
        })

        // Process watch providers - prioritize US, fallback to first available
        if (providersRes.ok) {
          const providersData = await providersRes.json()
          const usProviders = providersData.results?.US
          if (usProviders) {
            setProviders(usProviders)
          } else {
            // Fallback to first available country
            const firstCountry = Object.values(providersData.results || {})[0] as WatchProvidersData | undefined
            if (firstCountry) {
              setProviders(firstCountry)
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    fetchDetail()
  }, [tmdbId])

  const matchPercent = Math.round(matchScore * 100)
  const backdropUrl = detail?.backdrop_path
    ? `https://image.tmdb.org/t/p/w1280${detail.backdrop_path}`
    : null
  const poster = posterPath
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-[90vh] bg-bg-dark rounded-t-3xl sm:rounded-2xl overflow-y-auto no-scrollbar z-10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 transition-colors"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-red-400">{error}</p>
          </div>
        ) : detail ? (
          <>
            {/* Backdrop / Trailer */}
            {showTrailer && detail.trailerKey ? (
              <div className="relative w-full aspect-video bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${detail.trailerKey}?autoplay=1`}
                  className="absolute inset-0 w-full h-full"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={`${title} trailer`}
                />
              </div>
            ) : (
              <div className="relative h-56 w-full bg-gray-800">
                {backdropUrl ? (
                  <Image
                    src={backdropUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : poster ? (
                  <Image
                    src={poster}
                    alt={title}
                    fill
                    className="object-cover object-top"
                    unoptimized
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-5xl">🎬</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/40 to-transparent" />

                {/* Play trailer button */}
                {detail.trailerKey && (
                  <button
                    onClick={() => setShowTrailer(true)}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/90 group-hover:bg-primary flex items-center justify-center shadow-lg shadow-primary/30 transition-all group-hover:scale-110">
                      <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </button>
                )}

                {/* Match badge */}
                <div className="absolute top-4 left-4 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg border border-white/10 z-10">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {matchPercent}% Match
                </div>
              </div>
            )}

            {/* Content */}
            <div className="px-5 pb-8 -mt-4 relative z-10">
              <h1 className="text-2xl font-bold text-white mb-1">{detail.title}</h1>
              {detail.tagline && (
                <p className="text-sm text-primary italic mb-3">{detail.tagline}</p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center gap-2 mb-4 text-sm text-slate-400">
                <span>{detail.release_date?.substring(0, 4)}</span>
                {detail.runtime && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                    <span>{Math.floor(detail.runtime / 60)}h {detail.runtime % 60}m</span>
                  </>
                )}
                <span className="w-1 h-1 rounded-full bg-slate-500" />
                <span>★ {detail.vote_average.toFixed(1)} ({detail.vote_count.toLocaleString()})</span>
              </div>

              {/* Genres */}
              <div className="flex flex-wrap gap-2 mb-4">
                {detail.genres.map((g) => (
                  <span
                    key={g.id}
                    className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/5"
                  >
                    {g.name}
                  </span>
                ))}
              </div>

              {/* Streaming Providers */}
              {providers && (
                <div className="mb-5">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Where to Watch</p>
                  <div className="flex flex-wrap gap-2">
                    {providers.flatrate && providers.flatrate.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {providers.flatrate.slice(0, 6).map((p) => (
                          <div
                            key={p.provider_id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10"
                            title={p.provider_name}
                          >
                            {p.logo_path && (
                              <Image
                                src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                                alt={p.provider_name}
                                width={20}
                                height={20}
                                className="rounded"
                                unoptimized
                              />
                            )}
                            <span className="text-xs text-slate-300">{p.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!providers.flatrate?.length && providers.rent && providers.rent.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-slate-500 self-center mr-1">Rent:</span>
                        {providers.rent.slice(0, 4).map((p) => (
                          <div
                            key={p.provider_id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10"
                            title={`${p.provider_name} (Rent)`}
                          >
                            {p.logo_path && (
                              <Image
                                src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                                alt={p.provider_name}
                                width={20}
                                height={20}
                                className="rounded"
                                unoptimized
                              />
                            )}
                            <span className="text-xs text-slate-300">{p.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!providers.flatrate?.length && !providers.rent?.length && providers.buy && providers.buy.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        <span className="text-xs text-slate-500 self-center mr-1">Buy:</span>
                        {providers.buy.slice(0, 4).map((p) => (
                          <div
                            key={p.provider_id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10"
                            title={`${p.provider_name} (Buy)`}
                          >
                            {p.logo_path && (
                              <Image
                                src={`https://image.tmdb.org/t/p/w45${p.logo_path}`}
                                alt={p.provider_name}
                                width={20}
                                height={20}
                                className="rounded"
                                unoptimized
                              />
                            )}
                            <span className="text-xs text-slate-300">{p.provider_name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {providers.link && (
                      <a
                        href={providers.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline self-center ml-2"
                      >
                        More options →
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Overview */}
              <p className="text-sm text-slate-300 leading-relaxed mb-5">
                {detail.overview}
              </p>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm mb-5">
                {detail.spoken_languages.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Languages</p>
                    <p className="text-slate-300">{detail.spoken_languages.map(l => l.english_name).join(', ')}</p>
                  </div>
                )}
                {detail.production_companies.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Studio</p>
                    <p className="text-slate-300 truncate">{detail.production_companies[0].name}</p>
                  </div>
                )}
                {detail.budget > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Budget</p>
                    <p className="text-slate-300">${(detail.budget / 1_000_000).toFixed(0)}M</p>
                  </div>
                )}
                {detail.revenue > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Revenue</p>
                    <p className="text-slate-300">${(detail.revenue / 1_000_000).toFixed(0)}M</p>
                  </div>
                )}
              </div>

              {/* Watch trailer button (if not shown above) */}
              {detail.trailerKey && !showTrailer && (
                <button
                  onClick={() => setShowTrailer(true)}
                  className="w-full h-12 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Trailer
                </button>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
