import { Student as DomainStudent } from "@repaso/domain";
import type { StudentRepository } from "./repository";

export async function getStudentPracticeContent(
  repository: StudentRepository,
  slug: string,
  questionLimit = 5
): Promise<DomainStudent.StudentPracticeContent> {
  const detail = await repository.fetchTopicDetail(slug);

  if (!detail) {
    throw new Error("No encontramos el tema solicitado.");
  }

  const questions = await repository.fetchPracticeQuestions(detail.topic.id, questionLimit);
  const flaggedQuestionIds = await repository.fetchQuestionFlags(
    questions.map((question) => question.question_id)
  );

  return {
    detail,
    questions,
    flaggedQuestionIds,
  };
}

export async function updateStudentQuestionFlag(
  repository: StudentRepository,
  input: {
    tenantId: string;
    userId: string;
    questionId: string;
    flagged: boolean;
  }
): Promise<void> {
  return repository.setQuestionFlag(input);
}

export async function startStudentPracticeSession(
  repository: StudentRepository,
  input: {
    tenantId: string;
    userId: string;
    topicId: string;
    config?: Record<string, unknown>;
  }
) {
  return repository.createPracticeSession(input);
}

export async function submitStudentPracticeAttempt(
  repository: StudentRepository,
  input: {
    practiceSessionId: string;
    topicId: string;
    answers: DomainStudent.SelectedAnswer[];
  }
): Promise<DomainStudent.PracticeSubmissionSummary> {
  return repository.submitPracticeAttempt(input);
}
