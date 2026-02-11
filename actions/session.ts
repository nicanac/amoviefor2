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
import type { TMDBMovie } from "@/types/tmdb";
import {
  createSessionSchema,
  submitAnswerSchema,
  validate,
} from "@/lib/validations";
import { logError } from "@/lib/logger";

export async function createSession(coupleId: string) {
  const validated = validate(createSessionSchema, { coupleId });
  if ("error" in validated) return { error: validated.error };

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
    .neq("category", "language") // Remove language question
    .order("order", { ascending: true });

  if (error) return { error: error.message };

  // Transform all questions to be multi_choice as per user request
  // And inject options if they rely on slider/custom logic but are now multi_choice
  const transformedQuestions = questions.map((q) => {
    let options = (q.options as any[]) || [];

    if (options.length === 0) {
      if (q.category === "rating") {
        options = [
          { label: "Any (5+)", value: "5", emoji: "🤔" },
          { label: "Good (6+)", value: "6", emoji: "🙂" },
          { label: "Great (7+)", value: "7", emoji: "😃" },
          { label: "Excellent (8+)", value: "8", emoji: "🤩" },
          { label: "Masterpiece (9+)", value: "9", emoji: "🏆" },
        ];
      } else if (q.category === "length") {
        options = [
          { label: "Short (< 90m)", value: "short", emoji: "⚡" },
          { label: "Medium (90-120m)", value: "medium", emoji: "🍵" },
          { label: "Long (> 120m)", value: "long", emoji: "🍿" },
          { label: "Any Length", value: "any", emoji: "∞" },
        ];
      } else if (q.category === "era") {
        options = [
          { label: "Classic (< 1990)", value: "classic", emoji: "📺" },
          { label: "90s", value: "90s", emoji: "📼" },
          { label: "2000s", value: "2000s", emoji: "💿" },
          { label: "2010s", value: "2010s", emoji: "📱" },
          { label: "Recent (2020+)", value: "recent", emoji: "🚀" },
          { label: "Any Era", value: "any", emoji: "📅" },
        ];
      }
    }

    return {
      ...q,
      type: "multi_choice",
      options,
    };
  });

  return { questions: transformedQuestions };
}

export async function submitAnswer(
  sessionId: string,
  questionId: number,
  answer: unknown,
) {
  const validated = validate(submitAnswerSchema, {
    sessionId,
    questionId,
    answer,
  });
  if ("error" in validated) return { error: validated.error };

  const {
    sessionId: validSessionId,
    questionId: validQuestionId,
    answer: validAnswer,
  } = validated.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("user_answers").upsert(
    {
      session_id: validSessionId,
      user_id: user.id,
      question_id: validQuestionId,
      answer: validAnswer as Json,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "session_id,user_id,question_id" },
  );

  if (error) {
    await logError("2-implementation", "submitAnswer", error, {
      sessionId: validSessionId,
      questionId: validQuestionId,
    });
    return { error: error.message };
  }

  revalidatePath("/session/questions");
  return { success: true };
}

export async function checkBothAnsweredQuestion(
  sessionId: string,
  questionId: number,
) {
  const supabase = await createClient(true);

  const authClient = await createClient(false);
  const {
    data: { user },
  } = await authClient.auth.getUser();
  const currentUserId = user?.id;

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

  const partnerId =
    couple.user1_id === currentUserId ? couple.user2_id : couple.user1_id;

  if (!partnerId) return { error: "Partner not found" };

  const { data: partnerAnswer } = await supabase
    .from("user_answers")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", partnerId)
    .eq("question_id", questionId)
    .maybeSingle();

  return { partnerAnswered: !!partnerAnswer };
}

export async function checkBothAnswered(sessionId: string) {
  // Use Service Role to allow reading partner's answers (bypass RLS)
  const supabase = await createClient(true);

  // But we still need to know who the CURRENT user is for the UI context
  // The service role client doesn't have the user session, so we need a separate check or token
  // However, for this specific function, we can just look up the session/couple first

  // To identify "You" vs "Partner", we need the current user ID.
  // Since we are using Service Role, auth.getUser() might be empty or wrong context.
  // Let's create a standard client distinct from the admin one just to get the ID.
  const authClient = await createClient(false);
  const {
    data: { user },
  } = await authClient.auth.getUser();
  const currentUserId = user?.id;

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

  // Adjust fetch to filter out language question to match getQuestions
  const { data: questions } = await supabase
    .from("questions")
    .select("id")
    .neq("category", "language");

  const totalQuestions = questions?.length || 0;

  // Count answers for each user
  // We need to only count answers for VALID questions (excluding language)
  // Or just count all answers and trust the totalQuestions comparison?
  // Use filter on answers if possible, or just raw count if we assume old answers are cleaned up.
  // Safer to filter answers by valid question IDs.
  const validQuestionIds = questions?.map(q => q.id) || [];

  const { data: user1Answers } = await supabase
    .from("user_answers")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", couple.user1_id)
    .in("question_id", validQuestionIds);

  const { data: user2Answers } = await supabase
    .from("user_answers")
    .select("id")
    .eq("session_id", sessionId)
    .eq("user_id", couple.user2_id!)
    .in("question_id", validQuestionIds);

  const user1Done = (user1Answers?.length || 0) >= totalQuestions;
  const user2Done = (user2Answers?.length || 0) >= totalQuestions;

  const user1Count = user1Answers?.length || 0;
  const user2Count = user2Answers?.length || 0;
  // Debug logs for troubleshooting "You: 0"
  console.log(`[checkBothAnswered] Session: ${sessionId}`);
  console.log(`[checkBothAnswered] Current Auth User: ${currentUserId}`);
  console.log(
    `[checkBothAnswered] Couple User 1: ${couple.user1_id} (Answers: ${user1Answers?.length})`,
  );
  console.log(
    `[checkBothAnswered] Couple User 2: ${couple.user2_id} (Answers: ${user2Answers?.length})`,
  );

  let currentUserCount = 0;
  let partnerCount = 0;

  if (currentUserId === couple.user1_id) {
    currentUserCount = user1Count;
    partnerCount = user2Count;
  } else if (currentUserId === couple.user2_id) {
    currentUserCount = user2Count;
    partnerCount = user1Count;
  } else {
    // Fallback: If auth fails or user is not in couple (shouldn't happen), try to infer or show both?
    // For now, if we can't identify, let's assume valid counts are what matters.
    // If user1 has more answers, maybe they are user1? Unreliable.
    // Let's just return raw counts if we can't identify.
    // Actually, let's log this anomaly if possible, but for the UI to work:
    // If we return 0, the UI says "You: 0".
  }

  return {
    user1Done,
    user2Done,
    bothDone: user1Done && user2Done,
    user1Count,
    user2Count,
    currentUserCount,
    partnerCount,
    totalQuestions,
  };
}

export async function generateMovieRecommendations(sessionId: string) {
  const supabase = await createClient();

  // Check if already in swiping or matching (prevent duplicate calls)
  const { data: existingSession } = await supabase
    .from("sessions")
    .select("status")
    .eq("id", sessionId)
    .single();

  if (existingSession?.status === "swiping") {
    return { success: true, movieCount: 0, alreadyGenerated: true };
  }

  if (existingSession?.status === "completed") {
    return { success: true, movieCount: 0, alreadyGenerated: true };
  }

  if (existingSession?.status === "matching") {
    return { success: true, movieCount: 0, inProgress: true };
  }

  // Transition to matching
  await supabase
    .from("sessions")
    .update({ status: "matching" })
    .eq("id", sessionId);

  try {
    // Get session + couple
    const { data: session } = await supabase
      .from("sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (!session) throw new Error("Session not found");

    const { data: couple } = await supabase
      .from("couples")
      .select("*")
      .eq("id", session.couple_id)
      .single();

    if (!couple) throw new Error("Couple not found");

    // Get all questions & answers
    const { data: questions } = await supabase
      .from("questions")
      .select("*")
      .neq("category", "language") // Remove language
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
      throw new Error("Missing data for matching");
    }

    // Get seen movies for BOTH users
    const { data: seenMovies } = await supabase
      .from("seen_movies")
      .select("tmdb_id")
      .or(`user_id.eq.${couple.user1_id},user_id.eq.${couple.user2_id}`);

    const seenTmdbIds = new Set((seenMovies || []).map((m) => m.tmdb_id));

    // Build TMDB filters from combined preferences
    const filters = buildFiltersFromAnswers(
      user1Answers as unknown as UserAnswer[],
      user2Answers as unknown as UserAnswer[],
      questions as unknown as Question[],
    );

    // Fetch movies from TMDB
    let movies: TMDBMovie[] = [];
    try {
      movies = await discoverMovies(filters);
    } catch (err) {
      console.error("TMDB discover error:", err);
      movies = [];
    }

    // Filter out seen movies
    movies = movies.filter((m) => !seenTmdbIds.has(m.id));

    // Fallback: if < 3 movies, broaden search
    if (movies.length < 3) {
      try {
        const broadMovies = await discoverMovies({
          sort_by: "popularity.desc",
          page: 1,
        });
        const additional = broadMovies.filter(
          (m) => !seenTmdbIds.has(m.id) && !movies.find((e) => e.id === m.id),
        );
        movies = [...movies, ...additional].slice(0, 10);
      } catch (err) {
        console.error("TMDB fallback error:", err);
      }
    }

    if (movies.length === 0) {
      throw new Error(
        "No movies found matching your preferences. Try adjusting your answers.",
      );
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
      .upsert(movieInserts, {
        onConflict: "session_id, tmdb_id",
        ignoreDuplicates: true,
      });

    if (insertError) throw new Error(insertError.message);

    // Update generateMovieRecommendations to set status to 'completed'
    // Transition to completed (skip swiping)
    await supabase
      .from("sessions")
      .update({ status: "completed" })
      .eq("id", sessionId);

    revalidatePath("/session/match");
    return { success: true, movieCount: topMovies.length };
  } catch (error) {
    // Revert status to answering so users can retry
    await supabase
      .from("sessions")
      .update({ status: "answering" })
      .eq("id", sessionId);

    return {
      error:
        error instanceof Error
          ? error.message
          : "An error occurred during matching",
    };
  }
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

    const getGenreIds = (u?: UserAnswer) => {
      if (!u) return undefined;
      const vals = Array.isArray(u.answer)
        ? (u.answer as string[])
        : [u.answer as string];
      return genreQ.options
        .filter((o) => vals.includes(o.value))
        .map((o) => o.tmdb_genre_id)
        .filter((id): id is number => id !== undefined);
    };

    const ids1 = getGenreIds(u1);
    const ids2 = getGenreIds(u2);

    let genreIds: number[] = [];

    if (ids1 && ids2) {
      // Both answered: Intersection first, then union if empty
      genreIds = ids1.filter((id) => ids2.includes(id));
      if (genreIds.length === 0) genreIds = [...new Set([...ids1, ...ids2])];
    } else {
      // One answered: Use their preferences
      genreIds = ids1 || ids2 || [];
    }

    if (genreIds.length > 0) {
      filters.with_genres = genreIds.join(",");
    }
  }

  // Rating: use the lower of the two preferences (more inclusive)
  const ratingQ = questions.find((q) => q.category === "rating");
  if (ratingQ) {
    const u1 = user1Answers.find((a) => a.question_id === ratingQ.id);
    const u2 = user2Answers.find((a) => a.question_id === ratingQ.id);
    
    // Handle multi-choice arrays: take minimum value selected
    const getMinRating = (u?: UserAnswer) => {
      if (!u) return 6;
      const vals = Array.isArray(u.answer) 
        ? u.answer.map(Number) 
        : [Number(u.answer)];
      return Math.min(...vals);
    };

    const r1 = getMinRating(u1);
    const r2 = getMinRating(u2);
    
    // Inclusive: try to satisfy both by taking minimum
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
    
    const getEraRange = (u?: UserAnswer) => {
      if (!u) return eraRanges.any;
      const vals = Array.isArray(u.answer)
        ? (u.answer as string[])
        : [u.answer as string];
        
      if (vals.includes("any") || vals.length === 0) return eraRanges.any;
      
      // Calculate union of selected ranges
      let minDate = "2999-12-31";
      let maxDate = "1900-01-01";
      
      vals.forEach(val => {
        const [start, end] = eraRanges[val] || eraRanges.any;
        if (start < minDate) minDate = start;
        if (end > maxDate) maxDate = end;
      });
      
      return [minDate, maxDate];
    };

    const [min1, max1] = getEraRange(user1Answers.find(a => a.question_id === eraQ.id));
    const [min2, max2] = getEraRange(user2Answers.find(a => a.question_id === eraQ.id));

    // Union of both users' preferences
    // (If user 1 wants 90s and user 2 wants 2000s, show both?)
    // Original logic was intersection-ish. Let's do union to be safe/inclusive.
    const finalMin = min1 < min2 ? min1 : min2;
    const finalMax = max1 > max2 ? max1 : max2;

    filters["primary_release_date.gte"] = finalMin;
    filters["primary_release_date.lte"] = finalMax;
  }

  // Language section removed as per request

  // Length: use overlapping runtime range
  const lengthQ = questions.find((q) => q.category === "length");
  if (lengthQ) {
    const runtimeRanges: Record<string, [number, number]> = {
      short: [0, 89],
      medium: [90, 120],
      long: [121, 400],
      any: [0, 400],
    };

    const getLengthRange = (u?: UserAnswer) => {
      if (!u) return runtimeRanges.any;
      const vals = Array.isArray(u.answer)
        ? (u.answer as string[])
        : [u.answer as string];
      
      if (vals.includes("any") || vals.length === 0) return runtimeRanges.any;
      
      let minLen = 999;
      let maxLen = 0;
      
      vals.forEach(val => {
        const [start, end] = runtimeRanges[val] || runtimeRanges.any;
        if (start < minLen) minLen = start;
        if (end > maxLen) maxLen = end;
      });
      
      return [minLen, maxLen];
    };

    const [min1, max1] = getLengthRange(user1Answers.find(a => a.question_id === lengthQ.id));
    const [min2, max2] = getLengthRange(user2Answers.find(a => a.question_id === lengthQ.id));

    // Union
    const finalMin = Math.min(min1, min2);
    const finalMax = Math.max(max1, max2);

    // Only apply if not the full range
    if (finalMin > 0 || finalMax < 400) {
      filters["with_runtime.gte"] = finalMin;
      filters["with_runtime.lte"] = finalMax;
    }
  }

  // NOTE: Mood (category: "mood") is NOT used for TMDB filtering
  // because TMDB doesn't have a "mood" parameter. Mood preferences
  // are instead used in the scoring/ranking phase (lib/scoring.ts).

  // Platform: union of both users' streaming platform choices
  const platformQ = questions.find((q) => q.category === "platform");
  if (platformQ) {
    const u1 = user1Answers.find((a) => a.question_id === platformQ.id);
    const u2 = user2Answers.find((a) => a.question_id === platformQ.id);

    const getProviderIds = (answer: UserAnswer | undefined) => {
      if (!answer) return [];
      const vals = Array.isArray(answer.answer)
        ? (answer.answer as string[])
        : [answer.answer as string];
      return platformQ.options
        .filter((o) => vals.includes(o.value))
        .map((o) => o.provider_id)
        .filter((id): id is number => id !== undefined);
    };

    const ids1 = getProviderIds(u1);
    const ids2 = getProviderIds(u2);

    // Intersection first, union if empty
    let providerIds = ids1.filter((id) => ids2.includes(id));
    if (providerIds.length === 0)
      providerIds = [...new Set([...ids1, ...ids2])];

    if (providerIds.length > 0) {
      filters.with_watch_providers = providerIds.join("|");
      filters.watch_region = "US";
    }
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

export async function getLastCompletedSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Check both active and dissolved couples
  const { data: couples } = await supabase
    .from("couples")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

  if (!couples || couples.length === 0) return null;

  const coupleIds = couples.map((c) => c.id);

  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .in("couple_id", coupleIds)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return session;
}

export async function clearSession(sessionId: string) {
  const supabase = await createClient();
  // Delete the session explicitly
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
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

export async function endSessionAndDecouple(
  sessionId: string,
  coupleId: string,
) {
  const supabase = await createClient();

  // Ensure session is marked completed
  await supabase
    .from("sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);

  // Dissolve the couple
  await supabase
    .from("couples")
    .update({ status: "dissolved" })
    .eq("id", coupleId);

  revalidatePath("/dashboard");
  revalidatePath("/history");
  return { success: true };
}

export async function getSessionHistory() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all couples the user belongs to (active and dissolved)
  const { data: couples } = await supabase
    .from("couples")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

  if (!couples || couples.length === 0) return [];

  const coupleIds = couples.map((c) => c.id);

  // Get all completed sessions for those couples
  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .in("couple_id", coupleIds)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  if (!sessions || sessions.length === 0) return [];

  // For each session, get the movies
  const sessionIds = sessions.map((s) => s.id);
  const { data: allMovies } = await supabase
    .from("session_movies")
    .select("*")
    .in("session_id", sessionIds)
    .order("rank", { ascending: true });

  const moviesBySession = new Map<string, typeof allMovies>();
  for (const movie of allMovies || []) {
    const existing = moviesBySession.get(movie.session_id) || [];
    existing.push(movie);
    moviesBySession.set(movie.session_id, existing);
  }

  return sessions.map((s) => ({
    id: s.id,
    created_at: s.created_at,
    movies: (moviesBySession.get(s.id) || []).map((m) => ({
      id: m.id,
      tmdb_id: m.tmdb_id,
      title: m.title,
      poster_path: m.poster_path,
      match_score: m.match_score,
      release_year: m.release_year,
    })),
  }));
}
