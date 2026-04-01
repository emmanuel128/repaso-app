import type { SupabaseClient } from "@supabase/supabase-js";

export type GlobalSearchCategory = "topics" | "clinical_cases" | "mnemonics";

export interface GlobalSearchResult {
  id: string;
  category: GlobalSearchCategory;
  title: string;
  snippet: string;
  href: string;
  topic_slug?: string | null;
}

export interface GlobalSearchGroup {
  category: GlobalSearchCategory;
  label: string;
  results: GlobalSearchResult[];
}

const SNIPPET_CONTEXT_BEFORE = 55;
const SNIPPET_CONTEXT_AFTER = 85;
const DEFAULT_SNIPPET_LENGTH = 140;

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

function mapGroups(results: Record<GlobalSearchCategory, GlobalSearchResult[]>): GlobalSearchGroup[] {
  return [
    { category: "topics", label: "Temas", results: results.topics },
    { category: "clinical_cases", label: "Casos clínicos", results: results.clinical_cases },
    { category: "mnemonics", label: "Mnemotecnias", results: results.mnemonics },
  ];
}

function escapePostgrestLikeValue(value: string): string {
  return value.replace(/([,%()])/g, "\\$1");
}

export async function searchGlobalContent(
  client: SupabaseClient,
  query: string,
  limitPerCategory = 8
): Promise<GlobalSearchGroup[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return mapGroups({
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
    if (result.error) throw result.error;
  }

  return mapGroups({
    topics: (topicsResult.data ?? []).map((topic) => ({
      id: topic.id as string,
      category: "topics" as const,
      title: topic.name as string,
      snippet: buildSnippet(buildSnippetText(topic.name as string, topic.description as string | null | undefined), trimmedQuery),
      href: `/topics/${topic.slug as string}`,
      topic_slug: topic.slug as string,
    })),
    clinical_cases: (casesResult.data ?? [])
      .filter((caseItem) => Boolean((caseItem.topics as { slug?: string | null } | null)?.slug))
      .map((caseItem) => {
        const topic = caseItem.topics as { slug?: string | null } | null;
        return {
          id: caseItem.id as string,
          category: "clinical_cases" as const,
          title: caseItem.title as string,
          snippet: buildSnippet(
            buildSnippetText(caseItem.title as string, caseItem.body_md as string | null | undefined),
            trimmedQuery
          ),
          href: `/topics/${topic?.slug as string}#case-${caseItem.id as string}`,
          topic_slug: topic?.slug ?? null,
        };
      }),
    mnemonics: (mnemonicsResult.data ?? [])
      .filter((mnemonic) => Boolean((mnemonic.topics as { slug?: string | null } | null)?.slug))
      .map((mnemonic) => {
        const topic = mnemonic.topics as { slug?: string | null } | null;
        return {
          id: mnemonic.id as string,
          category: "mnemonics" as const,
          title: mnemonic.title as string,
          snippet: buildSnippet(
            buildSnippetText(mnemonic.title as string, mnemonic.content_md as string | null | undefined),
            trimmedQuery
          ),
          href: `/topics/${topic?.slug as string}#mnemonic-${mnemonic.id as string}`,
          topic_slug: topic?.slug ?? null,
        };
      }),
  });
}
