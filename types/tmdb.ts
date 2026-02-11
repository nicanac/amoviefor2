// =============================================================================
// TMDB API Response Types
// =============================================================================

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  adult: boolean;
  original_language: string;
  video: boolean;
}

export interface TMDBVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
}

export interface TMDBMovieDetail extends Omit<TMDBMovie, "genre_ids"> {
  genres: TMDBGenre[];
  runtime: number | null;
  status: string;
  tagline: string;
  budget: number;
  revenue: number;
  imdb_id: string | null;
  homepage: string | null;
  production_companies: TMDBProductionCompany[];
  spoken_languages: TMDBSpokenLanguage[];
  videos?: { results: TMDBVideo[] };
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TMDBDiscoverResponse {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBGenreListResponse {
  genres: TMDBGenre[];
}

// --- TMDB Discover Filters ---

export interface TMDBDiscoverFilters {
  with_genres?: string; // comma-separated genre IDs
  without_genres?: string;
  "primary_release_date.gte"?: string; // YYYY-MM-DD
  "primary_release_date.lte"?: string;
  "vote_average.gte"?: number;
  "vote_average.lte"?: number;
  with_original_language?: string;
  "with_runtime.gte"?: number;
  "with_runtime.lte"?: number;
  with_watch_providers?: string; // pipe-separated provider IDs
  watch_region?: string; // ISO 3166-1 country code
  sort_by?: string; // e.g. 'popularity.desc'
  page?: number;
  include_adult?: boolean;
}

// --- TMDB Genre ID Map (for reference) ---
export const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};
