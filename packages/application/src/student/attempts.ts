import type { AttemptReviewQuestion } from "@repaso/domain";
import type { StudentRepository } from "./repository";

export async function getStudentAttemptReview(
  repository: StudentRepository,
  attemptId: string
): Promise<AttemptReviewQuestion[]> {
  return repository.fetchAttemptReview(attemptId);
}
