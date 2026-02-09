"use server";

// =============================================================================
// Session Server Actions — SOP-002, SOP-003: Questions & Matching
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { discoverMovies } from "@/lib/tmdb";
import { rankMovies } from "@/lib/scoring";
import type { Json } from "@/types/database";
import type { Question, UserAnswer } from "@/types/domain";

export async function createSession(coupleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Guard: no active session already
  const { data: existing } = await supabase
    .from("sessions")
    .select("id")
    .eq("couple_id", coupleId)
    .in("status", ["answering", "matching", "swiping"])
    .maybeSingle();

  if (existing)
    return { error: "A session is already active", sessionId: existing.id };

  const { data: session, error } = await supabase
    .from("sessions")
    .insert({ couple_id: coupleId })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/session");
  return { session };
}

export async function getQuestions() {
  const supabase = await createClient();

  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .order("order", { ascending: true });

  if (error) return { error: error.message };
  return { questions };
}

export async function submitAnswer(
  sessionId: string,
  questionId: number,
  answer: unknown,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("user_answers").upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      question_id: questionId,
      answer: answer as Json,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "session_id,user_id,question_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/session/questions");
  return { success: true };
}

export async function checkBothAnswered(sessionId: string) {
  const supabase = await createClient();

  // Get session + couple info
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found" };

  const { data: couple } = await supabase
    .from("couples")
    .select("*")
    .eq("id", session.couple_id)
    .single();

  if (!couple) return { error: "Couple not found" };

  const { data: questions } = await supabase.from("questions").select("id");

  const totalQuestions = questions?.length || 0;

  // Count answers for each user
  const { data: user1Answers } = await supabase
    .from("user_answers")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", couple.user1_id);

  const { data: user2Answers } = await supabase
    .from("user_answers")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", couple.user2_id!);

  const user1Done = (user1Answers?.length || 0) >= totalQuestions;
  const user2Done = (user2Answers?.length || 0) >= totalQuestions;

  return {
    user1Done,
    user2Done,
    bothDone: user1Done && user2Done,
    user1Count: user1Answers?.length || 0,
    user2Count: user2Answers?.length || 0,
    totalQuestions,
  };
}

export async function generateMovieRecommendations(sessionId: string) {
  const supabase = await createClient();

  // Transition to matching
  await supabase
    .from("sessions")
    .update({ status: "matching" })
    .eq("id", sessionId);

  // Get session + couple
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) return { error: "Session not found" };

  const { data: couple } = await supabase
    .from("couples")
    .select("*")
    .eq("id", session.couple_id)
    .single();

  if (!couple) return { error: "Couple not found" };

  // Get all questions & answers
  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .order("order");

  const { data: user1Answers } = await supabase
    .from("user_answers")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", couple.user1_id);

  const { data: user2Answers } = await supabase
    .from("user_answers")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", couple.user2_id!);

  if (!questions || !user1Answers || !user2Answers) {
    return { error: "Missing data for matching" };
  }

  // Get seen movies for BOTH users
  const { data: seenMovies } = await supabase
    .from("seen_movies")
    .select("tmdb_id")
    .or(
      `user_id.eq.${couple.user1_id},user_id.eq.${couple.user2_id}`,
    );

  const seenTmdbIds = new Set((seenMovies || []).map((m) => m.tmdb_id));

  // Build TMDB filters from combined preferences
  const filters = buildFiltersFromAnswers(
    user1Answers as unknown as UserAnswer[],
    user2Answers as unknown as UserAnswer[],
    questions as unknown as Question[],
  );

  // Fetch movies from TMDB
  let movies = await discoverMovies(filters);

  // Filter out seen movies
  movies = movies.filter((m) => !seenTmdbIds.has(m.id));

  // Fallback: if < 3 movies, broaden search
  if (movies.length < 3) {
    const broadMovies = await discoverMovies({
      sort_by: "popularity.desc",
      page: 1,
    });
    const additional = broadMovies.filter(
      (m) => !seenTmdbIds.has(m.id) && !movies.find((e) => e.id === m.id),
    );
    movies = [...movies, ...additional].slice(0, 10);
  }

  // Score and rank
  const ranked = rankMovies(
    movies,
    user1Answers as unknown as UserAnswer[],
    user2Answers as unknown as UserAnswer[],
    questions as unknown as Question[],
  );

  // Take top movies (at least 3, up to 10)
  const topMovies = ranked.slice(0, Math.max(3, Math.min(10, ranked.length)));

  // Insert into session_movies
  const movieInserts = topMovies.map((m) => ({
    session_id: sessionId,
    tmdb_id: m.id,
    title: m.title,
    poster_path: m.poster_path || "",
    overview: m.overview,
    release_year: parseInt(m.release_date?.substring(0, 4) || "2000"),
    genres: m.genre_ids.map(String) as Json,
    vote_average: m.vote_average,
    match_score: m.match_score,
    rank: m.rank,
  }));

  const { error: insertError } = await supabase
    .from("session_movies")
    .insert(movieInserts);

  if (insertError) return { error: insertError.message };

  // Transition to swiping
  await supabase
    .from("sessions")
    .update({ status: "swiping" })
    .eq("id", sessionId);

  revalidatePath("/session/swipe");
  return { success: true, movieCount: topMovies.length };
}

// --- Helper: Build TMDB filters from answers ---

function buildFiltersFromAnswers(
  user1Answers: UserAnswer[],
  user2Answers: UserAnswer[],
  questions: Question[],
) {
  const filters: Record<string, string | number> = {
    sort_by: "popularity.desc",
    "vote_average.gte": 5,
  };

  // Genre: find intersection of both users' preferred genres
  const genreQ = questions.find((q) => q.category === "genre");
  if (genreQ) {
    const u1 = user1Answers.find((a) => a.question_id === genreQ.id);
    const u2 = user2Answers.find((a) => a.question_id === genreQ.id);
    if (u1 && u2) {
      const g1 = Array.isArray(u1.answer)
        ? (u1.answer as string[])
        : [u1.answer as string];
      const g2 = Array.isArray(u2.answer)
        ? (u2.answer as string[])
        : [u2.answer as string];

      // Find genre IDs from options
      const getGenreIds = (values: string[]) =>
        genreQ.options
          .filter((o) => values.includes(o.value))
          .map((o) => o.tmdb_genre_id)
          .filter((id): id is number => id !== undefined);

      const ids1 = getGenreIds(g1);
      const ids2 = getGenreIds(g2);

      // Intersection first, then union if empty
      let genreIds = ids1.filter((id) => ids2.includes(id));
      if (genreIds.length === 0) genreIds = [...new Set([...ids1, ...ids2])];

      if (genreIds.length > 0) {
        filters.with_genres = genreIds.join(",");
      }
    }
  }

  // Rating: use the lower of the two preferences (more inclusive)
  const ratingQ = questions.find((q) => q.category === "rating");
  if (ratingQ) {
    const u1 = user1Answers.find((a) => a.question_id === ratingQ.id);
    const u2 = user2Answers.find((a) => a.question_id === ratingQ.id);
    const r1 = u1 ? Number(u1.answer) : 6;
    const r2 = u2 ? Number(u2.answer) : 6;
    filters["vote_average.gte"] = Math.min(r1, r2);
  }

  // Era: use overlapping range
  const eraQ = questions.find((q) => q.category === "era");
  if (eraQ) {
    const eraRanges: Record<string, [string, string]> = {
      classic: ["1950-01-01", "1989-12-31"],
      "90s": ["1990-01-01", "1999-12-31"],
      "2000s": ["2000-01-01", "2009-12-31"],
      "2010s": ["2010-01-01", "2019-12-31"],
      recent: ["2020-01-01", "2030-12-31"],
      any: ["1950-01-01", "2030-12-31"],
    };
    const u1 = user1Answers.find((a) => a.question_id === eraQ.id);
    const u2 = user2Answers.find((a) => a.question_id === eraQ.id);
    const era1 = (u1?.answer as string) || "any";
    const era2 = (u2?.answer as string) || "any";
    const [min1, max1] = eraRanges[era1] || eraRanges.any;
    const [min2, max2] = eraRanges[era2] || eraRanges.any;

    // Use broadest range (union)
    filters["primary_release_date.gte"] = min1 < min2 ? min1 : min2;
    filters["primary_release_date.lte"] = max1 > max2 ? max1 : max2;
  }

  // Language
  const langQ = questions.find((q) => q.category === "language");
  if (langQ) {
    const u1 = user1Answers.find((a) => a.question_id === langQ.id);
    const u2 = user2Answers.find((a) => a.question_id === langQ.id);
    const l1 = (u1?.answer as string) || "any";
    const l2 = (u2?.answer as string) || "any";
    if (l1 === l2 && l1 !== "any") {
      filters.with_original_language = l1;
    }
    // If different, don't filter (be inclusive)
  }

  return filters;
}

export async function getActiveSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Find couple
  const { data: couple } = await supabase
    .from("couples")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("status", "active")
    .maybeSingle();

  if (!couple) return null;

  // Find active session
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("couple_id", couple.id)
    .in("status", ["answering", "matching", "swiping"])
    .order("created_at", { ascending: false })
    .maybeSingle();

  return session;
}

export async function getSessionMovies(sessionId: string) {
  const supabase = await createClient();

  const { data: movies } = await supabase
    .from("session_movies")
    .select("*")
    .eq("session_id", sessionId)
    .order("rank", { ascending: true });

  return movies || [];
}
