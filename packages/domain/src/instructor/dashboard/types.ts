export interface AttentionTopicRow {
  readonly topicId: string;
  readonly topicName: string;
  readonly topicSlug: string | null;
  readonly accuracy: number;
  readonly answeredQuestions: number;
  readonly studentsTracked: number;
}

export interface RecentActivityRow {
  readonly attemptId: string;
  readonly studentId: string;
  readonly studentName: string;
  readonly topicName: string;
  readonly topicSlug: string | null;
  readonly scorePercent: number;
  readonly submittedAt: string;
}

export interface DashboardSnapshot {
  readonly studentsCount: number;
  readonly activeStudentsLast7Days: number;
  readonly cohortAccuracy: number;
  readonly questionsAnswered: number;
  readonly attentionTopics: AttentionTopicRow[];
  readonly recentActivity: RecentActivityRow[];
}
