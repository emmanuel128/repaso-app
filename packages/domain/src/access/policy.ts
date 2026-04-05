import type { CurrentAccess } from "../shared/auth";
import { isOwnerRole } from "./roles";

export function canEnterStudentArea(access: CurrentAccess): boolean {
  return access.isAuthenticated && access.isStudent && access.hasActiveMembership;
}

export function canEnterInstructorArea(access: CurrentAccess): boolean {
  return access.isAuthenticated && access.isInstructor;
}

export function canEnterAdminArea(access: CurrentAccess): boolean {
  return access.isAuthenticated && access.isAdmin;
}

export function canEnterOwnerArea(access: CurrentAccess): boolean {
  return access.isAuthenticated && isOwnerRole(access.role);
}

export function getDefaultAuthenticatedRoute(access: CurrentAccess): string | null {
  if (canEnterOwnerArea(access)) {
    return "/owner";
  }

  if (canEnterAdminArea(access)) {
    return "/admin";
  }

  if (canEnterInstructorArea(access)) {
    return "/instructor";
  }

  if (canEnterStudentArea(access)) {
    return "/student/dashboard";
  }

  return null;
}
