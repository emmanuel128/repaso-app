"use client";

import { useEffect, useState } from "react";
import { getStudentDashboardSnapshot, type StudentRepository } from "@repaso/application";
import type { DashboardSnapshot } from "@repaso/domain";

export function useStudentDashboard(repository: StudentRepository) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    getStudentDashboardSnapshot(repository)
      .then((data) => {
        if (!mounted) {
          return;
        }

        setSnapshot(data);
        setError(null);
      })
      .catch((loadError) => {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : "No fue posible cargar tu progreso.");
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

  return { snapshot, loading, error };
}
