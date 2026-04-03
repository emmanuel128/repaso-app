"use client";

import type { ComponentType } from "react";
import { useResolvedCurrentAccess } from "@repaso/hooks";
import AccessNotice from "@/components/AccessNotice";
import PageLoader from "@/components/PageLoader";
import StudentDashboard from "@/app/(student)/dashboard/student-dashboard";
import { currentAccessDependencies } from "@/lib/repaso-dependencies";
import { toUserRole, type UserRole } from "@/lib/user-role";

function OwnerDashboardPlaceholder() {
  return <div>Owner Dashboard</div>;
}

function AdminDashboardPlaceholder() {
  return <div>Admin Dashboard</div>;
}

function InstructorDashboardPlaceholder() {
  return <div>Instructor Dashboard</div>;
}

const DASHBOARD_BY_ROLE: Record<Exclude<UserRole, "Student">, ComponentType> = {
  Owner: OwnerDashboardPlaceholder,
  Admin: AdminDashboardPlaceholder,
  Instructor: InstructorDashboardPlaceholder,
};

export default function DashboardPage() {
  const access = useResolvedCurrentAccess(currentAccessDependencies);

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

  const userRole = toUserRole(access.role);

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
    case "Instructor": {
      const RoleDashboard = DASHBOARD_BY_ROLE[userRole];
      return <RoleDashboard />;
    }
    default:
      return (
        <AccessNotice
          title="Rol no soportado"
          message="No fue posible determinar qué dashboard mostrar."
        />
      );
  }
}
