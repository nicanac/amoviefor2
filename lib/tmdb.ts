// =============================================================================
// TMDB API Client — Layer 3 Tool (atomic, deterministic)
// =============================================================================

import type {
  TMDBMovie,
  TMDBMovieDetail,
  TMDBDiscoverResponse,
  TMDBDiscoverFilters,
  TMDBGenre,
} from "@/types/tmdb";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

// --- Discover Movies (with filters) ---

export async function discoverMovies(
  filters: TMDBDiscoverFilters = {},
): Promise<TMDBMovie[]> {
  const params = new URLSearchParams({
    include_adult: "false",
    language: "en-US",
    sort_by: filters.sort_by || "popularity.desc",
    page: String(filters.page || 1),
  });

  if (filters.with_genres) params.set("with_genres", filters.with_genres);
  if (filters.without_genres)
    params.set("without_genres", filters.without_genres);
  if (filters["primary_release_date.gte"])
    params.set("primary_release_date.gte", filters["primary_release_date.gte"]);
  if (filters["primary_release_date.lte"])
    params.set("primary_release_date.lte", filters["primary_release_date.lte"]);
  if (filters["vote_average.gte"] !== undefined)
    params.set("vote_average.gte", String(filters["vote_average.gte"]));
  if (filters["vote_average.lte"] !== undefined)
    params.set("vote_average.lte", String(filters["vote_average.lte"]));
  if (filters.with_original_language)
    params.set("with_original_language", filters.with_original_language);
  if (filters["with_runtime.gte"] !== undefined)
    params.set("with_runtime.gte", String(filters["with_runtime.gte"]));
  if (filters["with_runtime.lte"] !== undefined)
    params.set("with_runtime.lte", String(filters["with_runtime.lte"]));

  const res = await fetch(`${TMDB_BASE_URL}/discover/movie?${params}`, {
    headers: getHeaders(),
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!res.ok)
    throw new Error(`TMDB discover failed: ${res.status} ${res.statusText}`);

  const data: TMDBDiscoverResponse = await res.json();
  return data.results;
}

// --- Get Movie Details ---

export async function getMovieDetail(
  movieId: number,
): Promise<TMDBMovieDetail> {
  const res = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?language=en-US`, {
    headers: getHeaders(),
    next: { revalidate: 86400 }, // Cache for 24 hours
  });

  if (!res.ok) throw new Error(`TMDB movie detail failed: ${res.status}`);

  return res.json();
}

// --- Get Genre List ---

export async function getGenres(): Promise<TMDBGenre[]> {
  const res = await fetch(`${TMDB_BASE_URL}/genre/movie/list?language=en`, {
    headers: getHeaders(),
    next: { revalidate: 604800 }, // Cache for 1 week
  });

  if (!res.ok) throw new Error(`TMDB genres failed: ${res.status}`);

  const data = await res.json();
  return data.genres;
}

// --- Image URL Helpers ---

export function getPosterUrl(
  path: string | null,
  size: "w185" | "w342" | "w500" | "w780" | "original" = "w500",
): string {
  if (!path) return "/placeholder-poster.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(
  path: string | null,
  size: "w780" | "w1280" | "original" = "w1280",
): string {
  if (!path) return "/placeholder-backdrop.svg";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}
