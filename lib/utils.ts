// =============================================================================
// Utility Functions — Layer 3 (atomic helpers)
// =============================================================================

import { type ClassValue, clsx } from "clsx";

/**
 * Merge Tailwind classes safely (replaces clsx + twMerge for now)
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Generate a unique 6-character partner code (uppercase alphanumeric)
 */
export function generatePartnerCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I/O/1/0 to avoid confusion
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Format a match score as a display percentage
 */
export function formatMatchPercent(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/**
 * Get relative time string ("just now", "2m ago", etc.)
 */
export function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Sleep helper for controlled delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
