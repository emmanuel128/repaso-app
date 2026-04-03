import type {
  Area,
  AttemptReviewQuestion,
  DashboardSnapshot,
  GlobalSearchGroup,
  PracticeQuestion,
  PracticeSession,
  PracticeSubmissionSummary,
  SelectedAnswer,
  Topic,
  TopicDetail,
} from "@repaso/domain";

export interface StudentRepository {
  fetchAreas(): Promise<Area[]>;
  fetchTopics(): Promise<Topic[]>;
  fetchTopicDetail(slug: string): Promise<TopicDetail | null>;
  searchContent(query: string, limitPerCategory?: number): Promise<GlobalSearchGroup[]>;
  fetchPracticeQuestions(topicId: string, limit?: number): Promise<PracticeQuestion[]>;
  fetchQuestionFlags(questionIds: string[]): Promise<string[]>;
  setQuestionFlag(input: {
    tenantId: string;
    userId: string;
    questionId: string;
    flagged: boolean;
  }): Promise<void>;
  createPracticeSession(input: {
    tenantId: string;
    userId: string;
    topicId: string;
    config?: Record<string, unknown>;
  }): Promise<PracticeSession>;
  submitPracticeAttempt(input: {
    practiceSessionId: string;
    topicId: string;
    answers: SelectedAnswer[];
  }): Promise<PracticeSubmissionSummary>;
  fetchAttemptReview(attemptId: string): Promise<AttemptReviewQuestion[]>;
  fetchDashboardSnapshot(): Promise<DashboardSnapshot>;
}
