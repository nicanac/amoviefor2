"use server";

// =============================================================================
// Auth Server Actions
// =============================================================================

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signupSchema, loginSchema, validate } from "@/lib/validations";
import { logError } from "@/lib/logger";

export async function signup(prevState: unknown, formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    username: formData.get("username") as string,
    full_name: (formData.get("full_name") as string) || "",
  };

  const validated = validate(signupSchema, raw);
  if ("error" in validated) return { error: validated.error };

  const { email, password, username, full_name } = validated.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name,
      },
    },
  });

  if (error) {
    await logError("2-implementation", "signup", error, { email });
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function login(prevState: unknown, formData: FormData) {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = validate(loginSchema, raw);
  if ("error" in validated) return { error: validated.error };

  const { email, password } = validated.data;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await logError("2-implementation", "login", error, { email });
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/login");
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Try to get existing profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profile) return profile;

  // Profile missing (trigger may have failed) — create it now
  const username =
    user.user_metadata?.username ?? `user_${user.id.slice(0, 8)}`;
  const fullName = user.user_metadata?.full_name ?? "";

  const { data: newProfile, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      username,
      full_name: fullName,
    })
    .select()
    .single();

  if (error) {
    console.error(
      "[getProfile] Failed to create missing profile:",
      error.message,
    );
    return null;
  }

  return newProfile;
}
