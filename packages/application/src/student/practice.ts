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

  const practiceSession = await repository.startPracticeSession(detail.topic.id, questionLimit);
  const flaggedQuestionIds = await repository.fetchQuestionFlags(
    practiceSession.questions.map((question) => question.question_id)
  );

  return {
    detail,
    practiceSessionId: practiceSession.practiceSessionId,
    questions: practiceSession.questions,
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
