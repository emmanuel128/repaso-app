"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useResolvedCurrentAccess } from "@repaso/hooks";
import AccessNotice from "@/components/AccessNotice";
import PageLoader from "@/components/PageLoader";
import StudentDashboard from "@/app/(student)/dashboard/student-dashboard";
import { currentAccessDependencies } from "@/lib/repaso-dependencies";
import { toUserRole, type UserRole } from "@/lib/user-role";

const REDIRECT_BY_ROLE: Record<Exclude<UserRole, "Student">, string> = {
  Owner: "/owner",
  Admin: "/admin",
  Instructor: "/instructor",
};

export default function DashboardPage() {
  const router = useRouter();
  const access = useResolvedCurrentAccess(currentAccessDependencies);

  const userRole = toUserRole(access.role);

  useEffect(() => {
    if (access.loading || !access.isAuthenticated || !userRole || userRole === "Student") {
      return;
    }

    router.replace(REDIRECT_BY_ROLE[userRole]);
  }, [access.isAuthenticated, access.loading, router, userRole]);

  if (access.loading) {
    return <PageLoader label="Cargando dashboard..." />;
  }

  if (!access.isAuthenticated) {
    return (
      <AccessNotice
        title="Acceso restringido"
        message={access.error ?? "Debes iniciar sesión para continuar."}
      />
    );
  }

  if (!userRole) {
    return (
      <AccessNotice
        title="Rol no disponible"
        message={access.error ?? "No encontramos un rol asignado para este usuario."}
      />
    );
  }

  switch (userRole) {
    case "Student":
      return <StudentDashboard />;
    case "Owner":
    case "Admin":
    case "Instructor":
      return <PageLoader label="Redirigiendo a tu área de trabajo..." />;
    default:
      return (
        <AccessNotice
          title="Rol no soportado"
          message="No fue posible determinar qué dashboard mostrar."
        />
      );
  }
}
