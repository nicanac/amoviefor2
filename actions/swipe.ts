"use server";

// =============================================================================
// Swipe Server Actions — SOP-004, SOP-005: Swipe & Match
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { recordSwipeSchema, validate } from "@/lib/validations";

export async function recordSwipe(
  sessionId: string,
  sessionMovieId: string,
  direction: "right" | "left",
) {
  const validated = validate(recordSwipeSchema, {
    sessionId,
    sessionMovieId,
    direction,
  });
  if ("error" in validated) return { error: validated.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Insert swipe (upsert to be idempotent)
  const { error } = await supabase.from("swipes").upsert(
    {
      session_id: sessionId,
      user_id: user.id,
      session_movie_id: sessionMovieId,
      direction,
      swiped_at: new Date().toISOString(),
    },
    { onConflict: "session_id,user_id,session_movie_id" },
  );

  if (error) return { error: error.message };

  // If right swipe, check for match
  if (direction === "right") {
    const matchResult = await checkForMatch(sessionId, sessionMovieId, user.id);
    if (matchResult?.isMatch) {
      return { success: true, isMatch: true, matchId: matchResult.matchId };
    }
  }

  return { success: true, isMatch: false };
}

async function checkForMatch(
  sessionId: string,
  sessionMovieId: string,
  currentUserId: string,
) {
  // Use Service Role to check partner's swipe (bypass RLS)
  const supabase = await createClient(true);

  // Get the session's couple to find partner
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (!session) return null;

  const { data: couple } = await supabase
    .from("couples")
    .select("*")
    .eq("id", session.couple_id)
    .single();

  if (!couple) return null;

  const partnerId =
    couple.user1_id === currentUserId ? couple.user2_id : couple.user1_id;

  if (!partnerId) return null;

  // Check if partner also swiped right on this movie
  const { data: partnerSwipe } = await supabase
    .from("swipes")
    .select("direction")
    .eq("session_id", sessionId)
    .eq("user_id", partnerId)
    .eq("session_movie_id", sessionMovieId)
    .eq("direction", "right")
    .maybeSingle();

  if (!partnerSwipe) return { isMatch: false };

  // MATCH! Both swiped right — create match record
  const { data: match, error } = await supabase
    .from("matches")
    .upsert(
      {
        session_id: sessionId,
        session_movie_id: sessionMovieId,
        matched_at: new Date().toISOString(),
      },
      { onConflict: "session_id,session_movie_id" },
    )
    .select()
    .single();

  if (error) return { isMatch: false };

  // Update session status to completed
  await supabase
    .from("sessions")
    .update({ status: "completed" })
    .eq("id", sessionId);

  revalidatePath("/session/match");
  return { isMatch: true, matchId: match.id };
}

export async function getSessionMatches(sessionId: string) {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .eq("session_id", sessionId);

  return matches || [];
}

export async function getUserSwipes(sessionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: swipes } = await supabase
    .from("swipes")
    .select("*")
    .eq("session_id", sessionId)
    .eq("user_id", user.id);

  return swipes || [];
}
