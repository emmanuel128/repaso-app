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
