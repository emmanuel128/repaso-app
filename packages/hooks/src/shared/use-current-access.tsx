"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { resolveCurrentAccess, type CurrentAccessDependencies } from "@repaso/application";
import type { CurrentAccess } from "@repaso/domain";

const DEFAULT_ACCESS: CurrentAccess = {
  loading: true,
  user: null,
  session: null,
  tenant: null,
  role: null,
  membership: null,
  isAuthenticated: false,
  hasActiveMembership: false,
  isStudent: false,
  isInstructor: false,
  isAdmin: false,
  error: null,
};

const CurrentAccessContext = createContext<CurrentAccess>(DEFAULT_ACCESS);

export function CurrentAccessProvider({
  dependencies,
  children,
}: {
  dependencies: CurrentAccessDependencies;
  children: ReactNode;
}) {
  const access = useResolvedCurrentAccess(dependencies);
  return <CurrentAccessContext.Provider value={access}>{children}</CurrentAccessContext.Provider>;
}

export function useCurrentAccess(): CurrentAccess {
  return useContext(CurrentAccessContext);
}

export function useResolvedCurrentAccess(
  dependencies: CurrentAccessDependencies
): CurrentAccess {
  const [state, setState] = useState<CurrentAccess>(DEFAULT_ACCESS);

  useEffect(() => {
    let mounted = true;

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    resolveCurrentAccess(dependencies).then((result) => {
      if (mounted) {
        setState(result);
      }
    });

    return () => {
      mounted = false;
    };
  }, [dependencies]);

  return state;
}
