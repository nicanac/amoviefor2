// =============================================================================
// Domain Types — App-level enums & types (canonical source: .vibe/nexus.md)
// =============================================================================

// --- Enums ---

export type CoupleStatus = "pending" | "active" | "dissolved";

export type SessionStatus =
  | "answering"
  | "matching"
  | "swiping"
  | "completed"
  | "expired";

export type QuestionType = "single_choice" | "multi_choice" | "slider";

export type QuestionCategory =
  | "genre"
  | "mood"
  | "era"
  | "length"
  | "language"
  | "rating";

export type SwipeDirection = "right" | "left";

export type SeenMovieSource = "auto" | "manual";

// --- Core Domain Types ---

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
  partner_code: string;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  id: string;
  user1_id: string;
  user2_id: string | null;
  status: CoupleStatus;
  created_at: string;
}

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  options: QuestionOption[];
  category: QuestionCategory;
  weight: number;
  order: number;
}

export interface QuestionOption {
  value: string;
  label: string;
  emoji?: string;
  tmdb_genre_id?: number;
}

export interface Session {
  id: string;
  couple_id: string;
  status: SessionStatus;
  created_at: string;
  expires_at: string;
}

export interface UserAnswer {
  id: string;
  session_id: string;
  user_id: string;
  question_id: number;
  answer: unknown; // jsonb — flexible per question type
  answered_at: string;
}

export interface SessionMovie {
  id: string;
  session_id: string;
  tmdb_id: number;
  title: string;
  poster_path: string;
  overview: string;
  release_year: number;
  genres: string[];
  vote_average: number;
  match_score: number;
  rank: number;
  created_at: string;
}

export interface Swipe {
  id: string;
  session_id: string;
  user_id: string;
  session_movie_id: string;
  direction: SwipeDirection;
  swiped_at: string;
}

export interface Match {
  id: string;
  session_id: string;
  session_movie_id: string;
  matched_at: string;
}

export interface SeenMovie {
  id: string;
  user_id: string;
  tmdb_id: number;
  source: SeenMovieSource;
  marked_at: string;
}

// --- Computed / View Types ---

export interface SessionWithCouple extends Session {
  couple: Couple;
}

export interface SessionMovieWithSwipes extends SessionMovie {
  user_swipe?: SwipeDirection | null;
  partner_swipe?: SwipeDirection | null;
}

export interface MatchWithMovie extends Match {
  movie: SessionMovie;
}
