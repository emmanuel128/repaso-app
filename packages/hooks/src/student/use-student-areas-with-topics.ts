"use client";

import { useEffect, useState } from "react";
import { getStudentAreasWithTopics, type StudentRepository } from "@repaso/application";
import type { AreaWithTopics } from "@repaso/domain";

export function useStudentAreasWithTopics(repository: StudentRepository) {
  const [areas, setAreas] = useState<AreaWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    getStudentAreasWithTopics(repository)
      .then((data) => {
        if (!mounted) {
          return;
        }

        setAreas(data);
        setError(null);
      })
      .catch((loadError) => {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "Error fetching areas/topics");
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
  }, [repository]);

  return { areas, loading, error };
}
