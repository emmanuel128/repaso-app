"use client";

import { useEffect, useState } from "react";
import { getStudentPracticeContent, type StudentRepository } from "@repaso/application";
import type { StudentPracticeContent } from "@repaso/domain";

export function useStudentPracticeContent(
  repository: StudentRepository,
  slug: string | null,
  questionLimit = 5
) {
  const [content, setContent] = useState<StudentPracticeContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setContent(null);
      setError("No encontramos el tema solicitado.");
      return;
    }

    let mounted = true;
    setLoading(true);

    getStudentPracticeContent(repository, slug, questionLimit)
      .then((data) => {
        if (!mounted) {
          return;
        }

        setContent(data);
        setError(null);
      })
      .catch((loadError) => {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar la práctica.");
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
  }, [questionLimit, repository, slug]);

  return { content, loading, error };
}
