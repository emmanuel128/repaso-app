import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCurrentMembership } from "./memberships";

export interface DashboardProgressRow {
  topic_id: string;
  total_correct: number;
  total_incorrect: number;
  last_score?: number | null;
  last_attempt_at?: string | null;
  topics?: {
    name: string;
    slug: string;
  } | null;
}

export interface DashboardAttemptRow {
  id: string;
  score: number;
  max_score: number;
  submitted_at?: string | null;
  practice_sessions?: {
    topic_id?: string | null;
    topics?: {
      name: string;
      slug: string;
    } | null;
  } | null;
}

export interface DashboardSnapshot {
  membershipStatus: string | null;
  completedQuestions: number;
  accuracy: number;
  topicsStudied: number;
  progressByTopic: DashboardProgressRow[];
  recentAttempts: DashboardAttemptRow[];
}

export async function fetchDashboardSnapshot(client: SupabaseClient): Promise<DashboardSnapshot> {
  const [membership, answersResult, progressResult, attemptsResult] = await Promise.all([
    fetchCurrentMembership(client),
    client.from("attempt_answers").select("is_correct"),
    client
      .from("user_topic_progress")
      .select("topic_id, total_correct, total_incorrect, last_score, last_attempt_at, topics(name, slug)")
      .order("last_attempt_at", { ascending: false }),
    client
      .from("attempts")
      .select("id, score, max_score, submitted_at, practice_sessions(topic_id, topics(name, slug))")
      .not("submitted_at", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(5),
  ]);

  for (const result of [answersResult, progressResult, attemptsResult]) {
    if (result.error) throw result.error;
  }

  const answers = answersResult.data ?? [];
  const completedQuestions = answers.length;
  const correctAnswers = answers.filter((row) => row.is_correct).length;
  const accuracy = completedQuestions > 0 ? Math.round((correctAnswers / completedQuestions) * 100) : 0;
  const progressByTopic: DashboardProgressRow[] = (progressResult.data ?? []).map((row: any) => ({
    topic_id: row.topic_id,
    total_correct: row.total_correct,
    total_incorrect: row.total_incorrect,
    last_score: row.last_score,
    last_attempt_at: row.last_attempt_at,
    topics: Array.isArray(row.topics) ? row.topics[0] ?? null : row.topics ?? null,
  }));
  const recentAttempts: DashboardAttemptRow[] = (attemptsResult.data ?? []).map((row: any) => ({
    id: row.id,
    score: row.score,
    max_score: row.max_score,
    submitted_at: row.submitted_at,
    practice_sessions: Array.isArray(row.practice_sessions)
      ? {
          ...(row.practice_sessions[0] ?? {}),
          topics: Array.isArray(row.practice_sessions?.[0]?.topics)
            ? row.practice_sessions[0].topics[0] ?? null
            : row.practice_sessions?.[0]?.topics ?? null,
        }
      : row.practice_sessions ?? null,
  }));

  return {
    membershipStatus: membership?.status ?? null,
    completedQuestions,
    accuracy,
    topicsStudied: progressByTopic.length,
    progressByTopic,
    recentAttempts,
  };
}
