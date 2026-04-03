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
