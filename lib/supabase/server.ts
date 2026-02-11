// =============================================================================
// Supabase Server Client — for Server Components & Server Actions
// =============================================================================

import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function createClient(useServiceRole = false) {
  const cookieStore = await cookies();

  // If asking for Service Role, use the raw supabase-js client to bypass all cookie/auth context
  // This guarantees we get a clean admin client that ignores RLS
  if (useServiceRole) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing but createClient(true) was called!");
      // Fallback to anon key (which will fail RLS checks but prevent crash)
      return createAdminClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    
    return createAdminClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        }
      }
    );
  }

  // Standard client for user operations (uses cookies, subject to RLS)
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
}
