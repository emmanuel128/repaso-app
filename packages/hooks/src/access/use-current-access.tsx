"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Access as ApplicationAccess } from "@repaso/application";
import { Shared as DomainShared } from "@repaso/domain";

const DEFAULT_ACCESS: DomainShared.CurrentAccess = {
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

const CurrentAccessContext = createContext<DomainShared.CurrentAccess>(DEFAULT_ACCESS);

export function CurrentAccessProvider({
  dependencies,
  children,
}: {
  dependencies: ApplicationAccess.CurrentAccessDependencies;
  children: ReactNode;
}) {
  const access = useCurrentAccessState(dependencies);
  return <CurrentAccessContext.Provider value={access}>{children}</CurrentAccessContext.Provider>;
}

export function useCurrentAccess(): DomainShared.CurrentAccess {
  return useContext(CurrentAccessContext);
}

function useCurrentAccessState(
  dependencies: ApplicationAccess.CurrentAccessDependencies
): DomainShared.CurrentAccess {
  const [state, setState] = useState<DomainShared.CurrentAccess>(DEFAULT_ACCESS);

  useEffect(() => {
    let mounted = true;

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
    }));

    ApplicationAccess.resolveCurrentAccess(dependencies).then((result) => {
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
