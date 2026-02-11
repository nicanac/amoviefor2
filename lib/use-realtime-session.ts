"use client";

// =============================================================================
// useRealtimeSession — Supabase Realtime hook for session events
// Listens for: user_answers (partner progress), session updates, matches
// Replaces polling with push-based notifications (SOP-002, SOP-004)
// =============================================================================

import { useEffect, useRef, useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// --- Types ---

interface RealtimeSessionOptions {
  /** The current session ID to subscribe to */
  sessionId: string;
  /** The current user's ID (to distinguish "you" vs "partner") */
  userId: string;
  /** Called when a partner submits a new answer */
  onPartnerAnswer?: (payload: PartnerAnswerPayload) => void;
  /** Called when session status changes (e.g., answering → matching → swiping) */
  onSessionStatusChange?: (newStatus: string) => void;
  /** Called when a match is created (both swiped right) */
  onMatch?: (payload: MatchPayload) => void;
  /** Called when a partner records a swipe (without revealing direction) */
  onPartnerSwipe?: () => void;
}

export interface PartnerAnswerPayload {
  questionId: number;
  answeredAt: string;
}

export interface MatchPayload {
  matchId: string;
  sessionMovieId: string;
  matchedAt: string;
}

// --- Hook ---

export function useRealtimeSession({
  sessionId,
  userId,
  onPartnerAnswer,
  onSessionStatusChange,
  onMatch,
  onPartnerSwipe,
}: RealtimeSessionOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Stable callback refs to avoid re-subscribing on every render
  const onPartnerAnswerRef = useRef(onPartnerAnswer);
  const onSessionStatusChangeRef = useRef(onSessionStatusChange);
  const onMatchRef = useRef(onMatch);
  const onPartnerSwipeRef = useRef(onPartnerSwipe);

  useEffect(() => {
    onPartnerAnswerRef.current = onPartnerAnswer;
  }, [onPartnerAnswer]);
  useEffect(() => {
    onSessionStatusChangeRef.current = onSessionStatusChange;
  }, [onSessionStatusChange]);
  useEffect(() => {
    onMatchRef.current = onMatch;
  }, [onMatch]);
  useEffect(() => {
    onPartnerSwipeRef.current = onPartnerSwipe;
  }, [onPartnerSwipe]);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`session:${sessionId}`, {
        config: { presence: { key: userId } },
      })

      // --- Listen for partner answers (INSERT on user_answers) ---
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_answers",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const record = payload.new as Record<string, unknown>;
          // Only notify if it's the PARTNER's answer, not our own
          if (record.user_id !== userId) {
            onPartnerAnswerRef.current?.({
              questionId: record.question_id as number,
              answeredAt: record.answered_at as string,
            });
          }
        },
      )

      // --- Listen for session status changes (UPDATE on sessions) ---
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const record = payload.new as Record<string, unknown>;
          onSessionStatusChangeRef.current?.(record.status as string);
        },
      )

      // --- Listen for matches (INSERT on matches) ---
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const record = payload.new as Record<string, unknown>;
          onMatchRef.current?.({
            matchId: record.id as string,
            sessionMovieId: record.session_movie_id as string,
            matchedAt: record.matched_at as string,
          });
        },
      )

      // --- Listen for partner swipes (INSERT on swipes) ---
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "swipes",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const record = payload.new as Record<string, unknown>;
          // Only notify for partner's swipes, don't reveal direction
          if (record.user_id !== userId) {
            onPartnerSwipeRef.current?.();
          }
        },
      );

    // Subscribe and track connection state
    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        setIsConnected(true);
        setConnectionError(null);
      } else if (status === "CHANNEL_ERROR") {
        setIsConnected(false);
        setConnectionError("Failed to connect to realtime channel");
      } else if (status === "TIMED_OUT") {
        setIsConnected(false);
        setConnectionError("Realtime connection timed out");
      }
    });

    channelRef.current = channel;

    // Cleanup on unmount or when sessionId changes
    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
    };
  }, [sessionId, userId]);

  const unsubscribe = useCallback(() => {
    channelRef.current?.unsubscribe();
    channelRef.current = null;
    setIsConnected(false);
  }, []);

  return { isConnected, connectionError, unsubscribe };
}
