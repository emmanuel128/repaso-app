"use client";

import { useEffect, useState } from "react";
import { Student as ApplicationStudent } from "@repaso/application";
import { Student as DomainStudent } from "@repaso/domain";
import { useStudentRepository } from "./dependencies";

export function useAreasWithTopics() {
  const repository = useStudentRepository();
  const [areas, setAreas] = useState<DomainStudent.AreaWithTopics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    ApplicationStudent.getStudentAreasWithTopics(repository)
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
