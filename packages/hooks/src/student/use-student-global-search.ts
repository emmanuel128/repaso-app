"use client";

import { useEffect, useState } from "react";
import { Student as ApplicationStudent } from "@repaso/application";
import { Student as DomainStudent } from "@repaso/domain";

export function useStudentGlobalSearch(
  repository: ApplicationStudent.StudentRepository,
  query: string,
  enabled = true
) {
  const [results, setResults] = useState<DomainStudent.GlobalSearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;
    setLoading(true);

    ApplicationStudent.searchStudentContent(repository, query)
      .then((data) => {
        if (!mounted) {
          return;
        }

        setResults(data);
        setError(null);
      })
      .catch((loadError) => {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible completar la búsqueda.");
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
  }, [enabled, query, repository]);

  return { results, loading, error };
}
