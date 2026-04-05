"use client";

import { Student as ApplicationStudent } from "@repaso/application";
import { Student as DomainStudent } from "@repaso/domain";
import { useStudentRepository } from "./dependencies";

export function usePracticeMutations() {
  const repository = useStudentRepository();

  return {
    async updateQuestionFlag(input: {
      tenantId: string;
      userId: string;
      questionId: string;
      flagged: boolean;
    }): Promise<void> {
      await ApplicationStudent.updateStudentQuestionFlag(repository, input);
    },
    async submitPracticeAttempt(input: {
      tenantId: string;
      userId: string;
      topicId: string;
      answers: DomainStudent.SelectedAnswer[];
      config?: Record<string, unknown>;
    }): Promise<DomainStudent.PracticeSubmissionSummary> {
      const session = await ApplicationStudent.startStudentPracticeSession(repository, {
        tenantId: input.tenantId,
        userId: input.userId,
        topicId: input.topicId,
        config: input.config,
      });

      return ApplicationStudent.submitStudentPracticeAttempt(repository, {
        practiceSessionId: session.id,
        topicId: input.topicId,
        answers: input.answers,
      });
    },
  };
}
