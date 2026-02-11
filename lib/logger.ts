// =============================================================================
// Self-Annealing Logger — Layer 3 Tool (atomic, deterministic)
// Formats and records error traces for AI agent self-healing workflows.
// Appends structured entries to .vibe/logbook.json at runtime.
// =============================================================================

import { readFile, writeFile } from "fs/promises";
import path from "path";

// --- Types ---

interface LogEntry {
  id: number;
  timestamp: string;
  phase: string;
  action: string;
  description: string;
  decision?: string;
  decisions?: string[];
  status: "complete" | "error" | "in-progress";
  trace?: ErrorTrace;
}

interface ErrorTrace {
  message: string;
  stack?: string;
  context: Record<string, unknown>;
  file?: string;
  resolution?: string;
}

interface Logbook {
  project: string;
  created: string;
  entries: LogEntry[];
}

// --- Constants ---

const LOGBOOK_PATH = path.join(process.cwd(), ".vibe", "logbook.json");

// --- Core Functions ---

/**
 * Read the current logbook from disk.
 * Returns a default structure if the file is missing or corrupt.
 */
async function readLogbook(): Promise<Logbook> {
  try {
    const raw = await readFile(LOGBOOK_PATH, "utf-8");
    return JSON.parse(raw) as Logbook;
  } catch {
    return {
      project: "amoviefor2",
      created: new Date().toISOString().split("T")[0],
      entries: [],
    };
  }
}

/**
 * Write the logbook back to disk (pretty-printed for AI readability).
 */
async function writeLogbook(logbook: Logbook): Promise<void> {
  await writeFile(
    LOGBOOK_PATH,
    JSON.stringify(logbook, null, 2) + "\n",
    "utf-8",
  );
}

/**
 * Append a generic log entry (info, milestone, decision).
 */
export async function logEntry(
  phase: string,
  action: string,
  description: string,
  options?: {
    decision?: string;
    decisions?: string[];
    status?: "complete" | "error" | "in-progress";
  },
): Promise<LogEntry> {
  const logbook = await readLogbook();

  const nextId =
    logbook.entries.length > 0
      ? Math.max(...logbook.entries.map((e) => e.id)) + 1
      : 1;

  const entry: LogEntry = {
    id: nextId,
    timestamp: new Date().toISOString(),
    phase,
    action,
    description,
    status: options?.status ?? "complete",
    ...(options?.decision && { decision: options.decision }),
    ...(options?.decisions && { decisions: options.decisions }),
  };

  logbook.entries.push(entry);
  await writeLogbook(logbook);
  return entry;
}

/**
 * Log an error with full trace for agent self-healing.
 * Follows the Self-Annealing Protocol from architecture.md:
 *   1. Capture full error trace (message, stack, context)
 *   2. Log to logbook.json with phase, action, trace
 *   3. Provide context for diagnosis (data, API, or logic issue)
 */
export async function logError(
  phase: string,
  action: string,
  error: unknown,
  context: Record<string, unknown> = {},
  file?: string,
): Promise<LogEntry> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  const logbook = await readLogbook();

  const nextId =
    logbook.entries.length > 0
      ? Math.max(...logbook.entries.map((e) => e.id)) + 1
      : 1;

  const entry: LogEntry = {
    id: nextId,
    timestamp: new Date().toISOString(),
    phase,
    action: `ERROR_${action}`,
    description: `Error in ${action}: ${errorMessage}`,
    status: "error",
    trace: {
      message: errorMessage,
      stack: errorStack,
      context,
      file,
    },
  };

  logbook.entries.push(entry);
  await writeLogbook(logbook);

  // Also log to stderr for immediate visibility
  console.error(`[Self-Annealing] ${phase}/${action}: ${errorMessage}`);

  return entry;
}

/**
 * Record a resolution after an error has been fixed.
 * Links back to the original error entry by ID.
 */
export async function logResolution(
  errorEntryId: number,
  resolution: string,
): Promise<void> {
  const logbook = await readLogbook();

  const errorEntry = logbook.entries.find((e) => e.id === errorEntryId);
  if (errorEntry?.trace) {
    errorEntry.trace.resolution = resolution;
    errorEntry.status = "complete";
  }

  // Also append a resolution log
  const nextId = Math.max(...logbook.entries.map((e) => e.id)) + 1;
  logbook.entries.push({
    id: nextId,
    timestamp: new Date().toISOString(),
    phase: errorEntry?.phase ?? "unknown",
    action: `RESOLVED_${errorEntry?.action ?? "UNKNOWN"}`,
    description: resolution,
    status: "complete",
  });

  await writeLogbook(logbook);
}

/**
 * Get recent errors from the logbook (for agent context loading).
 */
export async function getRecentErrors(limit = 5): Promise<LogEntry[]> {
  const logbook = await readLogbook();
  return logbook.entries.filter((e) => e.status === "error").slice(-limit);
}

/**
 * Safe wrapper that catches errors, logs them, and returns a typed result.
 * Use in Server Actions to automatically capture failures.
 *
 * @example
 * ```ts
 * const result = await withTracing("session", "createSession", { coupleId }, async () => {
 *   // ... your logic
 * });
 * ```
 */
export async function withTracing<T>(
  phase: string,
  action: string,
  context: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T | { error: string }> {
  try {
    return await fn();
  } catch (error) {
    await logError(phase, action, error, context);
    return {
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
