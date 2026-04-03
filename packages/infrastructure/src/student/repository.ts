import type { StudentRepository } from "@repaso/application";
import type {
  AttemptReviewQuestion,
  DashboardAttemptRow,
  DashboardProgressRow,
  DashboardSnapshot,
  GlobalSearchCategory,
  GlobalSearchGroup,
  GlobalSearchResult,
  PracticeQuestion,
  PracticeSession,
  PracticeSubmissionSummary,
  SelectedAnswer,
  Topic,
  TopicDetail,
} from "@repaso/domain";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAccessRepository } from "../shared/access-repository";

const SNIPPET_CONTEXT_BEFORE = 55;
const SNIPPET_CONTEXT_AFTER = 85;
const DEFAULT_SNIPPET_LENGTH = 140;

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function stripMarkdown(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSnippet(content: string, query: string, defaultSnippetLength = DEFAULT_SNIPPET_LENGTH): string {
  const normalizedContent = stripMarkdown(content);
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedContent) {
    return "";
  }

  if (!normalizedQuery) {
    return normalizedContent.slice(0, defaultSnippetLength).trim();
  }

  const matchIndex = normalizedContent.toLowerCase().indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return normalizedContent.slice(0, defaultSnippetLength).trim();
  }

  const start = Math.max(matchIndex - SNIPPET_CONTEXT_BEFORE, 0);
  const end = Math.min(matchIndex + normalizedQuery.length + SNIPPET_CONTEXT_AFTER, normalizedContent.length);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalizedContent.length ? "..." : "";

  return `${prefix}${normalizedContent.slice(start, end).trim()}${suffix}`;
}

function buildSnippetText(title: string, content?: string | null): string {
  return [title, content ?? ""].filter(Boolean).join(" ");
}

function mapSearchGroups(results: Record<GlobalSearchCategory, GlobalSearchResult[]>): GlobalSearchGroup[] {
  return [
    { category: "topics", label: "Temas", results: results.topics },
    { category: "clinical_cases", label: "Casos clínicos", results: results.clinical_cases },
    { category: "mnemonics", label: "Mnemotecnias", results: results.mnemonics },
  ];
}

function escapePostgrestLikeValue(value: string): string {
  return value.replace(/([,%()])/g, "\\$1");
}

async function fetchTopicBySlug(client: SupabaseClient, slug: string): Promise<Topic | null> {
  const { data, error } = await client
    .from("topics")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as Topic | null;
}

export function createSupabaseStudentRepository(client: SupabaseClient): StudentRepository {
  const accessRepository = createSupabaseAccessRepository(client);

  return {
    async fetchAreas() {
      const { data, error } = await client
        .from("areas")
        .select("*")
        .eq("status", "published")
        .order("order_index", { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },

    async fetchTopics() {
      const { data, error } = await client
        .from("topics")
        .select("*")
        .eq("status", "published")
        .order("order_index", { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },

    async fetchTopicDetail(slug: string): Promise<TopicDetail | null> {
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
        if (result.error) {
          throw result.error;
        }
      }

      return {
        topic,
        notes: (notesResult.data ?? []) as TopicDetail["notes"],
        mnemonics: (mnemonicsResult.data ?? []) as TopicDetail["mnemonics"],
        cases: (casesResult.data ?? []) as TopicDetail["cases"],
        progress: (progressResult.data ?? null) as TopicDetail["progress"],
        questionCount: questionCountResult.count ?? 0,
      };
    },

    async searchContent(query: string, limitPerCategory = 8): Promise<GlobalSearchGroup[]> {
      const trimmedQuery = query.trim();

      if (!trimmedQuery) {
        return mapSearchGroups({
          topics: [],
          clinical_cases: [],
          mnemonics: [],
        });
      }

      const pattern = `%${escapePostgrestLikeValue(trimmedQuery)}%`;

      const [topicsResult, casesResult, mnemonicsResult] = await Promise.all([
        client
          .from("topics")
          .select("id, name, slug, description")
          .eq("status", "published")
          .or(`name.ilike.${pattern},description.ilike.${pattern}`)
          .order("order_index", { ascending: true })
          .limit(limitPerCategory),
        client
          .from("cases")
          .select("id, title, body_md, topic_id, topics!cases_topic_id_fkey(slug)")
          .eq("status", "published")
          .or(`title.ilike.${pattern},body_md.ilike.${pattern}`)
          .order("created_at", { ascending: false })
          .limit(limitPerCategory),
        client
          .from("mnemonics")
          .select("id, title, content_md, topic_id, topics!mnemonics_topic_id_fkey(slug)")
          .eq("status", "published")
          .or(`title.ilike.${pattern},content_md.ilike.${pattern}`)
          .order("created_at", { ascending: false })
          .limit(limitPerCategory),
      ]);

      for (const result of [topicsResult, casesResult, mnemonicsResult]) {
        if (result.error) {
          throw result.error;
        }
      }

      return mapSearchGroups({
        topics: (topicsResult.data ?? []).map((topic) => ({
          id: topic.id as string,
          category: "topics" as const,
          title: topic.name as string,
          snippet: buildSnippet(buildSnippetText(topic.name as string, topic.description as string | null | undefined), trimmedQuery),
          href: `/topics/${topic.slug as string}`,
          topic_slug: topic.slug as string,
        })),
        clinical_cases: (casesResult.data ?? [])
          .map((caseItem) => ({
            caseItem,
            topic: normalizeSingleRelation(caseItem.topics as { slug?: string | null }[] | { slug?: string | null } | null),
          }))
          .filter(({ topic }) => Boolean(topic?.slug))
          .map(({ caseItem, topic }) => ({
            id: caseItem.id as string,
            category: "clinical_cases" as const,
            title: caseItem.title as string,
            snippet: buildSnippet(
              buildSnippetText(caseItem.title as string, caseItem.body_md as string | null | undefined),
              trimmedQuery
            ),
            href: `/topics/${topic?.slug as string}#case-${caseItem.id as string}`,
            topic_slug: topic?.slug ?? null,
          })),
        mnemonics: (mnemonicsResult.data ?? [])
          .map((mnemonic) => ({
            mnemonic,
            topic: normalizeSingleRelation(mnemonic.topics as { slug?: string | null }[] | { slug?: string | null } | null),
          }))
          .filter(({ topic }) => Boolean(topic?.slug))
          .map(({ mnemonic, topic }) => ({
            id: mnemonic.id as string,
            category: "mnemonics" as const,
            title: mnemonic.title as string,
            snippet: buildSnippet(
              buildSnippetText(mnemonic.title as string, mnemonic.content_md as string | null | undefined),
              trimmedQuery
            ),
            href: `/topics/${topic?.slug as string}#mnemonic-${mnemonic.id as string}`,
            topic_slug: topic?.slug ?? null,
          })),
      });
    },

    async fetchPracticeQuestions(topicId: string, limit = 10): Promise<PracticeQuestion[]> {
      const { data, error } = await client.rpc("get_topic_practice_questions", {
        p_topic_id: topicId,
        p_limit: limit,
      });

      if (error) {
        throw error;
      }

      return ((data ?? []) as PracticeQuestion[]).map((question) => ({
        ...question,
        options: [...question.options].sort((a, b) => a.order_index - b.order_index),
      }));
    },

    async fetchQuestionFlags(questionIds: string[]): Promise<string[]> {
      if (!questionIds.length) {
        return [];
      }

      const { data, error } = await client
        .from("user_question_flags")
        .select("question_id")
        .in("question_id", questionIds);

      if (error) {
        throw error;
      }

      return (data ?? []).map((row) => row.question_id as string);
    },

    async setQuestionFlag(input): Promise<void> {
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

        if (error) {
          throw error;
        }

        return;
      }

      const { error } = await client
        .from("user_question_flags")
        .delete()
        .eq("tenant_id", input.tenantId)
        .eq("user_id", input.userId)
        .eq("question_id", input.questionId);

      if (error) {
        throw error;
      }
    },

    async createPracticeSession(input): Promise<PracticeSession> {
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

      if (error) {
        throw error;
      }

      return data as PracticeSession;
    },

    async submitPracticeAttempt(input): Promise<PracticeSubmissionSummary> {
      const { data, error } = await client.rpc("submit_practice_attempt", {
        p_practice_session_id: input.practiceSessionId,
        p_topic_id: input.topicId,
        p_answers: input.answers,
      });

      if (error) {
        throw error;
      }

      const row = (data ?? [])[0];

      if (!row) {
        throw new Error("Practice submission did not return a result.");
      }

      return row as PracticeSubmissionSummary;
    },

    async fetchAttemptReview(attemptId: string): Promise<AttemptReviewQuestion[]> {
      const { data, error } = await client.rpc("get_attempt_review", {
        p_attempt_id: attemptId,
      });

      if (error) {
        throw error;
      }

      return (data ?? []) as AttemptReviewQuestion[];
    },

    async fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
      const [membership, answersResult, progressResult, attemptsResult] = await Promise.all([
        accessRepository.fetchCurrentMembership(),
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
        if (result.error) {
          throw result.error;
        }
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
        topics: normalizeSingleRelation(row.topics),
      }));
      const recentAttempts: DashboardAttemptRow[] = (attemptsResult.data ?? []).map((row: any) => {
        const practiceSession = normalizeSingleRelation(row.practice_sessions);
        return {
          id: row.id,
          score: row.score,
          max_score: row.max_score,
          submitted_at: row.submitted_at,
          practice_sessions: practiceSession
            ? {
                ...practiceSession,
                topics: normalizeSingleRelation(practiceSession.topics),
              }
            : null,
        };
      });

      return {
        membershipStatus: membership?.status ?? null,
        completedQuestions,
        accuracy,
        topicsStudied: progressByTopic.length,
        progressByTopic,
        recentAttempts,
      };
    },
  };
}
