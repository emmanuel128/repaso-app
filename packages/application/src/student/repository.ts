import { Student as DomainStudent } from "@repaso/domain";

export interface StudentRepository {
  fetchAreas(): Promise<DomainStudent.Area[]>;
  fetchTopics(): Promise<DomainStudent.Topic[]>;
  fetchTopicDetail(slug: string): Promise<DomainStudent.TopicDetail | null>;
  searchContent(query: string, limitPerCategory?: number): Promise<DomainStudent.GlobalSearchGroup[]>;
  startPracticeSession(topicId: string, limit?: number): Promise<DomainStudent.PracticeSessionContent>;
  fetchQuestionFlags(questionIds: string[]): Promise<string[]>;
  setQuestionFlag(input: {
    tenantId: string;
    userId: string;
    questionId: string;
    flagged: boolean;
  }): Promise<void>;
  submitPracticeAttempt(input: {
    practiceSessionId: string;
    topicId: string;
    answers: DomainStudent.SelectedAnswer[];
  }): Promise<DomainStudent.PracticeSubmissionSummary>;
  fetchAttemptReview(attemptId: string): Promise<DomainStudent.AttemptReviewQuestion[]>;
  fetchDashboardSnapshot(): Promise<DomainStudent.DashboardSnapshot>;
}
