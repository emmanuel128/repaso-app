import type { SupabaseClient } from "@supabase/supabase-js";

export interface PracticeQuestionOption {
  id: string;
  label?: string | null;
  value: string;
  order_index: number;
}

export interface PracticeQuestion {
  question_id: string;
  prompt: string;
  explanation?: string | null;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  options: PracticeQuestionOption[];
}

export interface UserQuestionFlag {
  id: string;
  tenant_id: string;
  user_id: string;
  question_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface PracticeSession {
  id: string;
  tenant_id: string;
  user_id: string;
  topic_id: string;
  config: Record<string, unknown>;
  started_at?: string;
  ended_at?: string | null;
}

export interface SelectedAnswer {
  question_id: string;
  selected_option_ids: string[];
}

export interface PracticeSubmissionSummary {
  attempt_id: string;
  score: number;
  max_score: number;
  correct_count: number;
  question_count: number;
}

export interface AttemptReviewOption extends PracticeQuestionOption {
  is_correct: boolean;
}

export interface AttemptReviewQuestion {
  question_id: string;
  prompt: string;
  explanation?: string | null;
  is_correct: boolean;
  score: number;
  selected_option_ids: string[];
  options: AttemptReviewOption[];
}

export async function createPracticeSession(
  client: SupabaseClient,
  input: {
    tenantId: string;
    userId: string;
    topicId: string;
    config?: Record<string, unknown>;
  }
): Promise<PracticeSession> {
  const { data, error } = await client
    .from("practice_sessions")
    .insert({
      tenant_id: input.tenantId,
      user_id: input.userId,
      topic_id: input.topicId,
      config: input.config ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as PracticeSession;
}

export async function fetchTopicPracticeQuestions(
  client: SupabaseClient,
  topicId: string,
  limit = 10
): Promise<PracticeQuestion[]> {
  const { data, error } = await client.rpc("get_topic_practice_questions", {
    p_topic_id: topicId,
    p_limit: limit,
  });

  if (error) throw error;
  return ((data ?? []) as PracticeQuestion[]).map((question) => ({
    ...question,
    options: [...question.options].sort((a, b) => a.order_index - b.order_index),
  }));
}

export async function fetchQuestionFlags(
  client: SupabaseClient,
  questionIds: string[]
): Promise<string[]> {
  if (!questionIds.length) {
    return [];
  }

  const { data, error } = await client
    .from("user_question_flags")
    .select("question_id")
    .in("question_id", questionIds);

  if (error) throw error;
  return (data ?? []).map((row) => row.question_id as string);
}

export async function setQuestionFlag(
  client: SupabaseClient,
  input: {
    tenantId: string;
    userId: string;
    questionId: string;
    flagged: boolean;
  }
): Promise<void> {
  if (input.flagged) {
    const { error } = await client.from("user_question_flags").upsert(
      {
        tenant_id: input.tenantId,
        user_id: input.userId,
        question_id: input.questionId,
      },
      {
        onConflict: "tenant_id,user_id,question_id",
        ignoreDuplicates: false,
      }
    );

    if (error) throw error;
    return;
  }

  const { error } = await client
    .from("user_question_flags")
    .delete()
    .eq("tenant_id", input.tenantId)
    .eq("user_id", input.userId)
    .eq("question_id", input.questionId);

  if (error) throw error;
}

export async function submitPracticeAttempt(
  client: SupabaseClient,
  input: {
    practiceSessionId: string;
    topicId: string;
    answers: SelectedAnswer[];
  }
): Promise<PracticeSubmissionSummary> {
  const { data, error } = await client.rpc("submit_practice_attempt", {
    p_practice_session_id: input.practiceSessionId,
    p_topic_id: input.topicId,
    p_answers: input.answers,
  });

  if (error) throw error;
  const row = (data ?? [])[0];

  if (!row) {
    throw new Error("Practice submission did not return a result.");
  }

  return row as PracticeSubmissionSummary;
}

export async function fetchAttemptReview(
  client: SupabaseClient,
  attemptId: string
): Promise<AttemptReviewQuestion[]> {
  const { data, error } = await client.rpc("get_attempt_review", {
    p_attempt_id: attemptId,
  });

  if (error) throw error;
  return (data ?? []) as AttemptReviewQuestion[];
}
