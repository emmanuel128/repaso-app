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

export interface PracticeSessionContent {
  practiceSessionId: string;
  questions: PracticeQuestion[];
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

export interface StudentPracticeContent {
  detail: import("./content").TopicDetail;
  practiceSessionId: string;
  questions: PracticeQuestion[];
  flaggedQuestionIds: string[];
}
