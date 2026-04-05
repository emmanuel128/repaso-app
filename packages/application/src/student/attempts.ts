import { Student as DomainStudent } from "@repaso/domain";
import type { StudentRepository } from "./repository";

export async function getStudentAttemptReview(
  repository: StudentRepository,
  attemptId: string
): Promise<DomainStudent.AttemptReviewQuestion[]> {
  return repository.fetchAttemptReview(attemptId);
}
