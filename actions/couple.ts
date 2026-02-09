"use server";

// =============================================================================
// Couple Server Actions — SOP-001: Couple Formation
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generatePartnerCode } from "@/lib/utils";

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

  // Find partner by code
  const { data: partner } = await supabase
    .from("profiles")
    .select("id")
    .eq("partner_code", partnerCode.toUpperCase())
    .single();

  if (!partner) return { error: "Invalid partner code" };
  if (partner.id === user.id) return { error: "Cannot couple with yourself" };

  // Find pending couple where partner is user1
  const { data: couple } = await supabase
    .from("couples")
    .select("*")
    .eq("user1_id", partner.id)
    .eq("status", "pending")
    .is("user2_id", null)
    .maybeSingle();

  if (!couple) return { error: "No pending invite from this partner" };

  // Activate the couple
  const { error } = await supabase
    .from("couples")
    .update({ user2_id: user.id, status: "active" })
    .eq("id", couple.id);

  if (error) return { error: error.message };

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
