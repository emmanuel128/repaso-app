export type ContentStatus = "draft" | "published" | "archived";

export interface Area {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string | null;
  order_index: number;
  status: ContentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface Topic {
  id: string;
  tenant_id: string;
  area_id: string;
  name: string;
  slug: string;
  description?: string | null;
  order_index: number;
  status: ContentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface TopicNote {
  id: string;
  topic_id: string;
  title: string;
  content_md: string;
  status: ContentStatus;
}

export interface Mnemonic {
  id: string;
  topic_id?: string | null;
  title: string;
  content_md: string;
  status: ContentStatus;
}

export interface CaseStudy {
  id: string;
  topic_id?: string | null;
  title: string;
  body_md: string;
  status: ContentStatus;
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

export interface AreaWithTopics extends Area {
  topics: Topic[];
}
