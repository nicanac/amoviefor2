"use server";

// =============================================================================
// Couple Server Actions — SOP-001: Couple Formation
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { joinCoupleSchema, validate } from "@/lib/validations";
import { logError } from "@/lib/logger";

export async function createCouple() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Guard: user must NOT already be in an active couple
  const { data: existingCouple } = await supabase
    .from("couples")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("status", "active")
    .maybeSingle();

  if (existingCouple) {
    return { error: "You are already in an active couple" };
  }

  const { data: couple, error } = await supabase
    .from("couples")
    .insert({ user1_id: user.id })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { couple };
}

export async function joinCouple(partnerCode: string) {
  const validated = validate(joinCoupleSchema, { partnerCode });
  if ("error" in validated) return { error: validated.error };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Guard: user must NOT already be in an active couple
  const { data: existingCouple } = await supabase
    .from("couples")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("status", "active")
    .maybeSingle();

  if (existingCouple) {
    return { error: "You are already in an active couple" };
  }

  // Use secure function to join (bypasses RLS)
  const { data, error } = await (
    supabase.rpc as unknown as (
      fn: string,
      params: Record<string, string>,
    ) => ReturnType<typeof supabase.rpc>
  )("join_couple_by_code", {
    p_partner_code: partnerCode.toUpperCase(),
    p_user2_id: user.id,
  });

  if (error) return { error: error.message };

  const result = data as { error?: string; success?: boolean } | null;
  if (result?.error) {
    await logError("2-implementation", "joinCouple", new Error(result.error), {
      partnerCode,
    });
    return { error: result.error };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getActiveCouple() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: couple } = await supabase
    .from("couples")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("status", "active")
    .maybeSingle();

  return couple;
}

export async function dissolveCouple(coupleId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("couples")
    .update({ status: "dissolved" })
    .eq("id", coupleId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getRecentPartners() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all couples the user has been part of
  const { data: couples } = await supabase
    .from("couples")
    .select("user1_id, user2_id, created_at")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!couples) return [];

  const partnerIds = new Set<string>();
  couples.forEach((c) => {
    if (c.user1_id && c.user1_id !== user.id) partnerIds.add(c.user1_id);
    if (c.user2_id && c.user2_id !== user.id) partnerIds.add(c.user2_id);
  });

  if (partnerIds.size === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .in("id", Array.from(partnerIds));

  return profiles || [];
}

export async function quickConnect(partnerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // 1. Check if user is already in an active couple -> dissolve it
  const { data: existingCouple } = await supabase
    .from("couples")
    .select("id")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("status", "active")
    .maybeSingle();

  if (existingCouple) {
    await supabase
      .from("couples")
      .update({ status: "dissolved" })
      .eq("id", existingCouple.id);
  }

  // 2. Check if PARTNER is in an active couple -> error (can't steal them easily)
  const { data: partnerCouple } = await supabase
    .from("couples")
    .select("id")
    .or(`user1_id.eq.${partnerId},user2_id.eq.${partnerId}`)
    .eq("status", "active")
    .maybeSingle();

  if (partnerCouple) {
    return { error: "Partner is currently in an active couple" };
  }

  // 3. Create new active couple
  // Note: RLS might require a trigger or RPC if standard insert doesn't allow setting user2_id immediately
  // for a user who isn't user2. But usually user1 can create.
  // If RLS policy for insert is "auth.uid() = user1_id", it should be fine.
  const { error } = await supabase.from("couples").insert({
    user1_id: user.id,
    user2_id: partnerId,
    status: "active",
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}
