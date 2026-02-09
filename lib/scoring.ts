// =============================================================================
// Scoring Engine — Layer 3 Tool (atomic, deterministic)
// Computes match_score for movies based on BOTH users' answers.
// Uses geometric mean to ensure movies must appeal to BOTH users.
// =============================================================================

import type { Question, UserAnswer } from "@/types/domain";
import type { TMDBMovie } from "@/types/tmdb";
import { TMDB_GENRE_MAP } from "@/types/tmdb";

// Category weights for scoring
const WEIGHTS: Record<string, number> = {
  genre: 0.35,
  mood: 0.2,
  era: 0.15,
  length: 0.1,
  language: 0.1,
  rating: 0.1,
};

// --- Main Scoring Function ---

export function computeMatchScore(
  movie: TMDBMovie,
  user1Answers: UserAnswer[],
  user2Answers: UserAnswer[],
  questions: Question[],
): number {
  let score = 0;

  for (const [category, weight] of Object.entries(WEIGHTS)) {
    const categoryQuestions = questions.filter((q) => q.category === category);
    if (categoryQuestions.length === 0) {
      score += weight * 0.5; // Neutral if no questions for category
      continue;
    }

    const user1Match = computeCategoryMatch(
      movie,
      user1Answers,
      categoryQuestions,
      category,
    );
    const user2Match = computeCategoryMatch(
      movie,
      user2Answers,
      categoryQuestions,
      category,
    );

    // Geometric mean: penalizes one-sided matches
    const categoryScore = Math.sqrt(user1Match * user2Match);
    score += categoryScore * weight;
  }

  return Math.max(0, Math.min(1, score));
}

// --- Category-Specific Matching ---

function computeCategoryMatch(
  movie: TMDBMovie,
  answers: UserAnswer[],
  categoryQuestions: Question[],
  category: string,
): number {
  switch (category) {
    case "genre":
      return scoreGenre(movie, answers, categoryQuestions);
    case "mood":
      return scoreMood(movie, answers, categoryQuestions);
    case "era":
      return scoreEra(movie, answers, categoryQuestions);
    case "length":
      return 0.7; // Default decent score — runtime not in basic TMDBMovie
    case "language":
      return scoreLanguage(movie, answers, categoryQuestions);
    case "rating":
      return scoreRating(movie, answers, categoryQuestions);
    default:
      return 0.5;
  }
}

function scoreGenre(
  movie: TMDBMovie,
  answers: UserAnswer[],
  questions: Question[],
): number {
  const genreAnswer = answers.find((a) =>
    questions.some((q) => q.id === a.question_id),
  );
  if (!genreAnswer) return 0.5;

  const selectedGenres = Array.isArray(genreAnswer.answer)
    ? (genreAnswer.answer as string[])
    : [genreAnswer.answer as string];

  // Map selected labels to TMDB genre IDs
  const question = questions.find((q) => q.id === genreAnswer.question_id);
  if (!question) return 0.5;

  const selectedGenreIds = question.options
    .filter((opt) => selectedGenres.includes(opt.value))
    .map((opt) => opt.tmdb_genre_id)
    .filter((id): id is number => id !== undefined);

  if (selectedGenreIds.length === 0) return 0.5;

  const matchingGenres = movie.genre_ids.filter((id) =>
    selectedGenreIds.includes(id),
  );
  return matchingGenres.length / selectedGenreIds.length;
}

function scoreMood(
  movie: TMDBMovie,
  answers: UserAnswer[],
  questions: Question[],
): number {
  // Mood maps loosely to genre combinations
  const moodAnswer = answers.find((a) =>
    questions.some((q) => q.id === a.question_id),
  );
  if (!moodAnswer) return 0.5;

  const mood = moodAnswer.answer as string;
  const movieGenreNames = movie.genre_ids
    .map((id) => TMDB_GENRE_MAP[id] || "")
    .filter(Boolean);

  const moodGenreMap: Record<string, string[]> = {
    romantic: ["Romance", "Drama", "Comedy"],
    thrilling: ["Thriller", "Action", "Crime", "Mystery"],
    funny: ["Comedy", "Animation", "Family"],
    epic: ["Action", "Adventure", "Science Fiction", "Fantasy"],
    dark: ["Horror", "Thriller", "Crime"],
    chill: ["Comedy", "Drama", "Animation", "Family"],
  };

  const moodGenres = moodGenreMap[mood] || [];
  if (moodGenres.length === 0) return 0.5;

  const matches = movieGenreNames.filter((g) => moodGenres.includes(g));
  return matches.length > 0 ? Math.min(1, matches.length / 2) : 0.1;
}

function scoreEra(
  movie: TMDBMovie,
  answers: UserAnswer[],
  questions: Question[],
): number {
  const eraAnswer = answers.find((a) =>
    questions.some((q) => q.id === a.question_id),
  );
  if (!eraAnswer) return 0.5;

  const era = eraAnswer.answer as string;
  const movieYear = parseInt(movie.release_date?.substring(0, 4) || "2000");

  const eraRanges: Record<string, [number, number]> = {
    classic: [1950, 1989],
    "90s": [1990, 1999],
    "2000s": [2000, 2009],
    "2010s": [2010, 2019],
    recent: [2020, 2030],
    any: [1950, 2030],
  };

  const [min, max] = eraRanges[era] || [1950, 2030];
  if (movieYear >= min && movieYear <= max) return 1.0;
  // Partial credit for nearby eras
  const distance = Math.min(
    Math.abs(movieYear - min),
    Math.abs(movieYear - max),
  );
  return Math.max(0, 1 - distance / 20);
}

function scoreLanguage(
  movie: TMDBMovie,
  answers: UserAnswer[],
  questions: Question[],
): number {
  const langAnswer = answers.find((a) =>
    questions.some((q) => q.id === a.question_id),
  );
  if (!langAnswer) return 0.5;

  const selectedLangs = Array.isArray(langAnswer.answer)
    ? (langAnswer.answer as string[])
    : [langAnswer.answer as string];

  return selectedLangs.includes(movie.original_language) ||
    selectedLangs.includes("any")
    ? 1.0
    : 0.3;
}

function scoreRating(
  movie: TMDBMovie,
  answers: UserAnswer[],
  questions: Question[],
): number {
  const ratingAnswer = answers.find((a) =>
    questions.some((q) => q.id === a.question_id),
  );
  if (!ratingAnswer) return 0.5;

  const minRating = Number(ratingAnswer.answer) || 6;
  // TMDB vote_average is 0-10
  return movie.vote_average >= minRating
    ? 1.0
    : Math.max(0, movie.vote_average / minRating);
}

// --- Rank Movies ---

export function rankMovies(
  movies: TMDBMovie[],
  user1Answers: UserAnswer[],
  user2Answers: UserAnswer[],
  questions: Question[],
): Array<TMDBMovie & { match_score: number; rank: number }> {
  const scored = movies.map((movie) => ({
    ...movie,
    match_score: computeMatchScore(
      movie,
      user1Answers,
      user2Answers,
      questions,
    ),
    rank: 0,
  }));

  scored.sort((a, b) => b.match_score - a.match_score);
  scored.forEach((movie, index) => {
    movie.rank = index + 1;
  });

  return scored;
}
