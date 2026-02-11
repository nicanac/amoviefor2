// =============================================================================
// Scoring Engine — Layer 3 Tool (atomic, deterministic)
// Computes match_score for movies based on BOTH users' answers.
// Uses weighted average of per-category scores with geometric mean
// to ensure movies must appeal to BOTH users.
// =============================================================================

import type { Question, UserAnswer } from "@/types/domain";
import type { TMDBMovie } from "@/types/tmdb";
import { TMDB_GENRE_MAP } from "@/types/tmdb";

// Category weights for scoring (only categories with actual questions)
// Category weights for scoring (only categories with actual questions)
// Language removed and weights redistributed
const WEIGHTS: Record<string, number> = {
  genre: 0.30,   // increased from 0.25
  mood: 0.20,    // increased from 0.15
  era: 0.15,
  length: 0.1,
  // language: removed
  rating: 0.15,
  platform: 0.1,
};

// --- Main Scoring Function ---

export function computeMatchScore(
  movie: TMDBMovie,
  user1Answers: UserAnswer[],
  user2Answers: UserAnswer[],
  questions: Question[],
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  for (const [category, weight] of Object.entries(WEIGHTS)) {
    const categoryQuestions = questions.filter((q) => q.category === category);
    if (categoryQuestions.length === 0) continue; // Skip categories with no questions

    const u1Answered = user1Answers.some((a) =>
      categoryQuestions.some((q) => q.id === a.question_id),
    );
    const u2Answered = user2Answers.some((a) =>
      categoryQuestions.some((q) => q.id === a.question_id),
    );

    if (!u1Answered && !u2Answered) continue; // Skip if neither answered

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
    weightedScore += categoryScore * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0.5;

  // Normalize to 0-1 based on actual weights used
  const rawScore = weightedScore / totalWeight;

  // Apply a curve to spread scores more visibly between 60-98%
  // This maps raw 0.3-1.0 range into a more visible 0.55-0.98 range
  const curved = 0.55 + rawScore * 0.43;

  return Math.max(0, Math.min(1, curved));
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
      return scoreLength(movie, answers, categoryQuestions);
    case "rating":
      return scoreRating(movie, answers, categoryQuestions);
    case "platform":
      return scorePlatform(movie, answers, categoryQuestions);
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

  if (matchingGenres.length === 0) return 0.1;

  // At least one match = good, more = better
  return Math.min(1.0, 0.6 + (matchingGenres.length / selectedGenreIds.length) * 0.4);
}

function scoreMood(
  movie: TMDBMovie,
  answers: UserAnswer[],
  questions: Question[],
): number {
  const moodAnswer = answers.find((a) =>
    questions.some((q) => q.id === a.question_id),
  );
  if (!moodAnswer) return 0.5;

  const selectedMoods = Array.isArray(moodAnswer.answer)
    ? (moodAnswer.answer as string[])
    : [moodAnswer.answer as string];

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

  let totalMatches = 0;
  
  // Check against all selected moods
  for (const mood of selectedMoods) {
    const moodGenres = moodGenreMap[mood] || [];
    const matches = movieGenreNames.filter((g) => moodGenres.includes(g));
    totalMatches += matches.length;
  }

  if (totalMatches === 0) return 0.15;
  // Score based on accumulated matches relative to number of moods selected?
  // Or just pure count. Let's cap at 1.0.
  return Math.min(1.0, 0.6 + totalMatches * 0.1);
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

  const selectedEras = Array.isArray(eraAnswer.answer)
    ? (eraAnswer.answer as string[])
    : [eraAnswer.answer as string];

  const movieYear = parseInt(movie.release_date?.substring(0, 4) || "2000");

  const eraRanges: Record<string, [number, number]> = {
    classic: [1950, 1989],
    "90s": [1990, 1999],
    "2000s": [2000, 2009],
    "2010s": [2010, 2019],
    recent: [2020, 2030],
    any: [1950, 2030],
  };

  if (selectedEras.includes("any")) return 1.0;

  // Check if movie matches ANY of the selected eras
  let bestScore = 0.1;

  for (const era of selectedEras) {
    const [min, max] = eraRanges[era] || [1950, 2030];
    if (movieYear >= min && movieYear <= max) {
      return 1.0; // Perfect match for one of the preferences
    }
    
    // Partial credit
    const distance = Math.min(
      Math.abs(movieYear - min),
      Math.abs(movieYear - max),
    );
    const score = Math.max(0.1, 1 - distance / 15);
    if (score > bestScore) bestScore = score;
  }

  return bestScore;
}

// Function scoreLanguage removed

function scoreRating(
  movie: TMDBMovie,
  answers: UserAnswer[],
  questions: Question[],
): number {
  const ratingAnswer = answers.find((a) =>
    questions.some((q) => q.id === a.question_id),
  );
  if (!ratingAnswer) return 0.5;

  const selectedRatings = Array.isArray(ratingAnswer.answer)
    ? ratingAnswer.answer.map(Number)
    : [Number(ratingAnswer.answer)];

  // Use the Lowest selected rating as the "minimum acceptable"
  // If user picks "6+" and "8+", they technically tolerate 6+.
  const minRating = Math.min(...selectedRatings) || 6;
  
  if (movie.vote_average >= minRating) return 1.0;
  // Smooth falloff below threshold
  if (movie.vote_average >= minRating - 1) return 0.7;
  return Math.max(0.1, movie.vote_average / minRating);
}

function scoreLength(
  movie: TMDBMovie & { runtime?: number | null },
  answers: UserAnswer[],
  questions: Question[],
): number {
  const lengthAnswer = answers.find((a) =>
    questions.some((q) => q.id === a.question_id),
  );
  if (!lengthAnswer) return 0.5;

  const selectedLengths = Array.isArray(lengthAnswer.answer)
    ? (lengthAnswer.answer as string[])
    : [lengthAnswer.answer as string];

  // Note: runtime is not available in basic TMDBMovie from discover
  const runtime = movie.runtime;
  if (!runtime) return 0.5;

  const runtimeRanges: Record<string, [number, number]> = {
    short: [0, 89],
    medium: [90, 120],
    long: [121, 400],
    any: [0, 400],
  };

  if (selectedLengths.includes("any")) return 1.0;

  let bestScore = 0.2;

  for (const lengthType of selectedLengths) {
    const [min, max] = runtimeRanges[lengthType] || [0, 400];
    if (runtime >= min && runtime <= max) {
      return 1.0;
    }
    
    // Partial credit logic
    let currentScore = 0.2;
    if (lengthType === "short" && runtime <= 110) currentScore = 0.5;
    if (lengthType === "medium" && runtime >= 70 && runtime <= 150) currentScore = 0.6;
    if (lengthType === "long" && runtime >= 100) currentScore = 0.6;
    
    if (currentScore > bestScore) bestScore = currentScore;
  }
  
  return bestScore;
}

function scorePlatform(
  movie: TMDBMovie,
  answers: UserAnswer[],
  questions: Question[],
): number {
  // Platform filtering is done at the TMDB API level (with_watch_providers)
  const platformAnswer = answers.find((a) =>
    questions.some((q) => q.id === a.question_id),
  );
  
  if (!platformAnswer) return 0.5;
  
  const selectedPlatforms = Array.isArray(platformAnswer.answer)
    ? (platformAnswer.answer as string[])
    : [platformAnswer.answer as string];
    
  if (selectedPlatforms.includes("any") || selectedPlatforms.length === 0) {
    return 0.5;
  }
  
  // Movie passed platform filter, give it a boost
  return 0.8;
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
