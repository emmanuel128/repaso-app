"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { CurrentAccess } from "@repaso/domain";
import { useResolvedCurrentAccess } from "@repaso/hooks";
import AccessNotice from "@/components/AccessNotice";
import PageLoader from "@/components/PageLoader";
import { currentAccessDependencies } from "@/lib/repaso-dependencies";

interface RoleGuardLayoutProps {
  authorize: (access: CurrentAccess) => boolean;
  areaLabel: string;
  children: ReactNode;
}

export default function RoleGuardLayout({
  authorize,
  areaLabel,
  children,
}: RoleGuardLayoutProps) {
  const router = useRouter();
  const access = useResolvedCurrentAccess(currentAccessDependencies);
  const isAuthorized = authorize(access);

  useEffect(() => {
    if (access.loading) {
      return;
    }

    if (!access.isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!isAuthorized) {
      router.replace("/dashboard");
    }
  }, [access.isAuthenticated, access.loading, isAuthorized, router]);

  if (access.loading) {
    return <PageLoader label={`Validando acceso a ${areaLabel}...`} />;
  }

  if (!access.isAuthenticated) {
    return <PageLoader label="Redirigiendo al login..." />;
  }

  if (!isAuthorized) {
    return (
      <AccessNotice
        title="Access Denied"
        message={`No tienes permiso para acceder al área de ${areaLabel}.`}
      />
    );
  }

  return <div className="min-h-screen bg-background">{children}</div>;
}
