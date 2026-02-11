// =============================================================================
// Environment Verification — Layer 3 Tool (atomic, deterministic)
// Validates ALL required env vars at runtime to prevent silent failures.
// Run at app startup or during CI/CD deployment checks.
// =============================================================================

interface EnvVar {
  name: string;
  required: boolean;
  /** If true, must be a valid URL */
  isUrl?: boolean;
  /** If true, the key is secret and should not be logged */
  secret?: boolean;
  /** Description shown in error messages */
  description: string;
}

const ENV_VARS: EnvVar[] = [
  {
    name: "NEXT_PUBLIC_SUPABASE_URL",
    required: true,
    isUrl: true,
    secret: false,
    description: "Supabase project URL (public)",
  },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    secret: false,
    description: "Supabase anonymous key for client-side auth (public)",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    required: true,
    secret: true,
    description: "Supabase service role key for admin operations (server-only)",
  },
  {
    name: "TMDB_API_KEY",
    required: true,
    secret: true,
    description: "TMDB v3 API key for movie search",
  },
  {
    name: "TMDB_ACCESS_TOKEN",
    required: false,
    secret: true,
    description: "TMDB v4 access token (optional, for advanced endpoints)",
  },
];

interface VerifyResult {
  ok: boolean;
  missing: string[];
  invalid: string[];
  warnings: string[];
  summary: string;
}

/**
 * Verify all required environment variables are present and valid.
 * Returns a structured result for programmatic use.
 */
export function verifyEnv(): VerifyResult {
  const missing: string[] = [];
  const invalid: string[] = [];
  const warnings: string[] = [];

  for (const v of ENV_VARS) {
    const value = process.env[v.name];

    if (!value || value.trim() === "") {
      if (v.required) {
        missing.push(`${v.name} — ${v.description}`);
      } else {
        warnings.push(`${v.name} is not set (optional: ${v.description})`);
      }
      continue;
    }

    if (v.isUrl) {
      try {
        new URL(value);
      } catch {
        invalid.push(
          `${v.name} is not a valid URL: "${v.secret ? "***" : value}"`,
        );
      }
    }
  }

  const ok = missing.length === 0 && invalid.length === 0;

  const lines: string[] = [];
  if (ok) {
    lines.push("✅ All required environment variables are configured.");
  } else {
    if (missing.length > 0) {
      lines.push(`❌ Missing (${missing.length}):`);
      missing.forEach((m) => lines.push(`   - ${m}`));
    }
    if (invalid.length > 0) {
      lines.push(`❌ Invalid (${invalid.length}):`);
      invalid.forEach((i) => lines.push(`   - ${i}`));
    }
  }
  if (warnings.length > 0) {
    lines.push(`⚠️  Warnings (${warnings.length}):`);
    warnings.forEach((w) => lines.push(`   - ${w}`));
  }

  return { ok, missing, invalid, warnings, summary: lines.join("\n") };
}

/**
 * Guard function — throws if critical env vars are missing.
 * Call at app startup (e.g., in `instrumentation.ts` or a layout).
 */
export function assertEnv(): void {
  const result = verifyEnv();
  if (!result.ok) {
    console.error("\n=== ENVIRONMENT VERIFICATION FAILED ===");
    console.error(result.summary);
    console.error("========================================\n");
    throw new Error(
      `Environment check failed: ${result.missing.length} missing, ${result.invalid.length} invalid variable(s). Check server logs.`,
    );
  }
  if (result.warnings.length > 0) {
    console.warn("[verify-env]", result.warnings.join("; "));
  }
}

// --- CLI runner: `npx tsx tools/verify-env.ts` ---
if (typeof require !== "undefined" && require.main === module) {
  const result = verifyEnv();
  console.log(result.summary);
  process.exit(result.ok ? 0 : 1);
}
