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
      topicId: string;
      practiceSessionId: string;
      answers: DomainStudent.SelectedAnswer[];
    }): Promise<DomainStudent.PracticeSubmissionSummary> {
      return ApplicationStudent.submitStudentPracticeAttempt(repository, {
        practiceSessionId: input.practiceSessionId,
        topicId: input.topicId,
        answers: input.answers,
      });
    },
  };
}
