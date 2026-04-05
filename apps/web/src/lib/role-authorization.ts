import type { Shared as DomainShared } from "@repaso/domain";

function hasRequiredRole(
  access: DomainShared.CurrentAccess,
  role: DomainShared.RoleType
) {
  return access.isAuthenticated && access.role === role;
}

export function canAccessAdminArea(access: DomainShared.CurrentAccess) {
  return hasRequiredRole(access, "admin");
}

export function canAccessInstructorArea(access: DomainShared.CurrentAccess) {
  return hasRequiredRole(access, "instructor");
}

export function canAccessOwnerArea(access: DomainShared.CurrentAccess) {
  return hasRequiredRole(access, "owner");
}
