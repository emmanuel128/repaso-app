"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Access as DomainAccess, type Shared as DomainShared } from "@repaso/domain";
import { Access } from "@repaso/hooks";
import AccessNotice from "@/components/AccessNotice";
import PageLoader from "@/components/PageLoader";

type GuardArea = "admin" | "instructor" | "owner";

interface RoleGuardLayoutProps {
  area: GuardArea;
  areaLabel: string;
  children: ReactNode;
}

function canAccessArea(
  area: GuardArea,
  access: DomainShared.CurrentAccess
): boolean {
  switch (area) {
    case "admin":
      return DomainAccess.canEnterAdminArea(access);
    case "instructor":
      return DomainAccess.canEnterInstructorArea(access);
    case "owner":
      return DomainAccess.canEnterOwnerArea(access);
    default:
      return false;
  }
}

export default function RoleGuardLayout({
  area,
  areaLabel,
  children,
}: RoleGuardLayoutProps) {
  const router = useRouter();
  const access = Access.useCurrentAccess();
  const isAuthorized = canAccessArea(area, access);

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
