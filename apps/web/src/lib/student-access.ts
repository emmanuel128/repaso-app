"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Membership, User } from "@repaso/sdk";
import { fetchCurrentMembership, hasStudentAccess } from "@repaso/sdk";
import { createAuthClient, supabaseBrowser } from "@/lib/supabase";

export interface StudentAccessState {
  loading: boolean;
  user: User | null;
  membership: Membership | null;
  allowed: boolean;
  error: string | null;
}

const DEFAULT_STATE: StudentAccessState = {
  loading: true,
  user: null,
  membership: null,
  allowed: false,
  error: null,
};

export function useStudentAccess() {
  const [state, setState] = useState<StudentAccessState>(DEFAULT_STATE);
  const router = useRouter();

  useEffect(() => {
    const auth = createAuthClient();
    const client = supabaseBrowser();

    let mounted = true;

    async function load() {
      try {
        const { session, error: sessionError } = await auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          router.replace("/login");
          return;
        }

        const [{ user, error: userError }, membership] = await Promise.all([
          auth.getUser(),
          fetchCurrentMembership(client),
        ]);

        if (userError) {
          throw userError;
        }

        if (!mounted) {
          return;
        }

        const allowed = hasStudentAccess(membership);

        setState({
          loading: false,
          user,
          membership,
          allowed,
          error: allowed ? null : "Tu membresía no tiene acceso activo al contenido de estudio.",
        });
      } catch (error) {
        if (!mounted) {
          return;
        }

        setState({
          loading: false,
          user: null,
          membership: null,
          allowed: false,
          error: error instanceof Error ? error.message : "No fue posible validar tu acceso.",
        });
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  return state;
}
