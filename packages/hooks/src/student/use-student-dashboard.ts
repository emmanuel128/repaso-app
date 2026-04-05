"use client";

import { useEffect, useState } from "react";
import { Student as ApplicationStudent } from "@repaso/application";
import { Student as DomainStudent } from "@repaso/domain";
import { useStudentRepository } from "./dependencies";

export function useDashboard() {
  const repository = useStudentRepository();
  const [snapshot, setSnapshot] = useState<DomainStudent.DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    ApplicationStudent.getStudentDashboardSnapshot(repository)
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
