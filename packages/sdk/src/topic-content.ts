import type { SupabaseClient } from "@supabase/supabase-js";
import type { Topic } from "./topics";

export interface TopicNote {
  id: string;
  topic_id: string;
  title: string;
  content_md: string;
  status: "draft" | "published" | "archived";
}

export interface Mnemonic {
  id: string;
  topic_id?: string | null;
  title: string;
  content_md: string;
  status: "draft" | "published" | "archived";
}

export interface CaseStudy {
  id: string;
  topic_id?: string | null;
  title: string;
  body_md: string;
  status: "draft" | "published" | "archived";
}

export interface UserTopicProgress {
  id: string;
  topic_id: string;
  total_correct: number;
  total_incorrect: number;
  last_score?: number | null;
  last_attempt_at?: string | null;
}

export interface TopicDetail {
  topic: Topic;
  notes: TopicNote[];
  mnemonics: Mnemonic[];
  cases: CaseStudy[];
  progress: UserTopicProgress | null;
  questionCount: number;
}

export async function fetchTopicBySlug(client: SupabaseClient, slug: string): Promise<Topic | null> {
  const { data, error } = await client
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return (data ?? null) as Topic | null;
}

export async function fetchTopicDetail(client: SupabaseClient, slug: string): Promise<TopicDetail | null> {
  const topic = await fetchTopicBySlug(client, slug);

  if (!topic) {
    return null;
  }

  const [notesResult, mnemonicsResult, casesResult, progressResult, questionCountResult] = await Promise.all([
    client
      .from("topic_notes")
      .select("id, topic_id, title, content_md, status")
      .eq("topic_id", topic.id)
      .eq("status", "published")
      .order("created_at", { ascending: true }),
    client
      .from("mnemonics")
      .select("id, topic_id, title, content_md, status")
      .eq("topic_id", topic.id)
      .eq("status", "published")
      .order("created_at", { ascending: true }),
    client
      .from("cases")
      .select("id, topic_id, title, body_md, status")
      .eq("topic_id", topic.id)
      .eq("status", "published")
      .order("created_at", { ascending: true }),
    client
      .from("user_topic_progress")
      .select("id, topic_id, total_correct, total_incorrect, last_score, last_attempt_at")
      .eq("topic_id", topic.id)
      .maybeSingle(),
    client
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("topic_id", topic.id)
      .eq("status", "published"),
  ]);

  for (const result of [notesResult, mnemonicsResult, casesResult, progressResult, questionCountResult]) {
    if (result.error) throw result.error;
  }

  return {
    topic,
    notes: (notesResult.data ?? []) as TopicNote[],
    mnemonics: (mnemonicsResult.data ?? []) as Mnemonic[],
    cases: (casesResult.data ?? []) as CaseStudy[],
    progress: (progressResult.data ?? null) as UserTopicProgress | null,
    questionCount: questionCountResult.count ?? 0,
  };
}
