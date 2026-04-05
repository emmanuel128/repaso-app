"use client";

import type { Student as DomainStudent } from "@repaso/domain";

export interface PracticeDraft {
  topicId: string;
  topicSlug: string;
  topicName: string;
  questions: DomainStudent.PracticeQuestion[];
  answers: Record<string, string>;
  flaggedQuestionIds: string[];
  updatedAt: string;
}

function getDraftKey(userId: string, topicSlug: string) {
  return `practice-draft:${userId}:${topicSlug}`;
}

export function loadPracticeDraft(userId: string, topicSlug: string): PracticeDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(getDraftKey(userId, topicSlug));

  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue) as PracticeDraft;
  } catch {
    window.sessionStorage.removeItem(getDraftKey(userId, topicSlug));
    return null;
  }
}

export function savePracticeDraft(userId: string, topicSlug: string, draft: PracticeDraft): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(getDraftKey(userId, topicSlug), JSON.stringify(draft));
}

export function clearPracticeDraft(userId: string, topicSlug: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(getDraftKey(userId, topicSlug));
}

export function sanitizePracticeDraft(
  draft: PracticeDraft | null,
  questions: DomainStudent.PracticeQuestion[]
): Pick<PracticeDraft, "answers" | "flaggedQuestionIds"> {
  const validQuestionIds = new Set(questions.map((question) => question.question_id));
  const answers = Object.fromEntries(
    Object.entries(draft?.answers ?? {}).filter(([questionId, answerId]) => validQuestionIds.has(questionId) && Boolean(answerId))
  );
  const flaggedQuestionIds = (draft?.flaggedQuestionIds ?? []).filter((questionId) => validQuestionIds.has(questionId));

  return {
    answers,
    flaggedQuestionIds,
  };
}
