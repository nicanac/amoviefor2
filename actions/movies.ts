"use server";

// =============================================================================
// Movie Server Actions — Seen movies management
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markAsSeen(
  tmdbId: number,
  source: "auto" | "manual" = "manual",
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("seen_movies").upsert(
    {
      user_id: user.id,
      tmdb_id: tmdbId,
      source,
      marked_at: new Date().toISOString(),
    },
    { onConflict: "user_id,tmdb_id" },
  );

  if (error) return { error: error.message };

  revalidatePath("/history");
  return { success: true };
}

export async function removeFromSeen(tmdbId: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("seen_movies")
    .delete()
    .eq("user_id", user.id)
    .eq("tmdb_id", tmdbId);

  if (error) return { error: error.message };

  revalidatePath("/history");
  return { success: true };
}

export async function getSeenMovies() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("seen_movies")
    .select("*")
    .eq("user_id", user.id)
    .order("marked_at", { ascending: false });

  return data || [];
}

export async function getMatchHistory() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // 1. Get all couples the user belongs to
  const { data: couples } = await supabase
    .from("couples")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

  if (!couples || couples.length === 0) return [];

  const coupleIds = couples.map((c) => c.id);

  // 2. Get all sessions for those couples
  const { data: sessions } = await supabase
    .from("sessions")
    .select("id")
    .in("couple_id", coupleIds);

  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);

  // 3. Get all matches for those sessions
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .in("session_id", sessionIds)
    .order("matched_at", { ascending: false });

  if (!matches || matches.length === 0) return [];

  // 4. Get all session_movies referenced by matches
  const movieIds = matches.map((m) => m.session_movie_id);
  const { data: sessionMovies } = await supabase
    .from("session_movies")
    .select("*")
    .in("id", movieIds);

  const movieMap = new Map((sessionMovies || []).map((sm) => [sm.id, sm]));

  // 5. Join manually
  return matches.map((m) => ({
    id: m.id,
    matched_at: m.matched_at,
    session_movies: movieMap.get(m.session_movie_id) ?? null,
  }));
}
