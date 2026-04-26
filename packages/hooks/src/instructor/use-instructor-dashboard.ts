"use client";

import { useEffect, useState } from "react";
import { Instructor as ApplicationInstructor } from "@repaso/application";
import { Instructor as DomainInstructor } from "@repaso/domain";
import { useInstructorRepository } from "./dependencies";

export function useDashboard() {
  const repository = useInstructorRepository();
  const [snapshot, setSnapshot] =
    useState<DomainInstructor.DashboardSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    ApplicationInstructor.getInstructorDashboardSnapshot(repository)
      .then((data) => {
        if (!mounted) {
          return;
        }

        setSnapshot(data);
        setError(null);
      })
      .catch((loadError) => {
        if (mounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No fue posible cargar el dashboard del instructor."
          );
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
