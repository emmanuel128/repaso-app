"use client";

import { useEffect, useState } from "react";
import { Student as ApplicationStudent } from "@repaso/application";
import { Student as DomainStudent } from "@repaso/domain";

export function useStudentTopicDetail(
  repository: ApplicationStudent.StudentRepository,
  slug: string | null
) {
  const [detail, setDetail] = useState<DomainStudent.TopicDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      setDetail(null);
      setError("No encontramos ese tema.");
      return;
    }

    let mounted = true;
    setLoading(true);

    ApplicationStudent.getStudentTopicDetail(repository, slug)
      .then((data) => {
        if (!mounted) {
          return;
        }

        setDetail(data);
        setError(data ? null : "No encontramos ese tema.");
      })
      .catch((loadError) => {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar el tema.");
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
  }, [repository, slug]);

  return { detail, loading, error };
}
