"use client";

import { useEffect, useState } from "react";
import { Student as ApplicationStudent } from "@repaso/application";
import { Student as DomainStudent } from "@repaso/domain";

export function useStudentAttemptReview(
  repository: ApplicationStudent.StudentRepository,
  attemptId: string | null
) {
  const [review, setReview] = useState<DomainStudent.AttemptReviewQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) {
      setLoading(false);
      setReview([]);
      setError("No encontramos respuestas para este intento.");
      return;
    }

    let mounted = true;
    setLoading(true);

    ApplicationStudent.getStudentAttemptReview(repository, attemptId)
      .then((data) => {
        if (!mounted) {
          return;
        }

        setReview(data);
        setError(data.length ? null : "No encontramos respuestas para este intento.");
      })
      .catch((loadError) => {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar la revisión.");
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [attemptId, repository]);

  return { review, loading, error };
}
