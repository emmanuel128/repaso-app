import type { CurrentAccess } from "./auth";

export function canEnterStudentArea(access: CurrentAccess): boolean {
  return access.isAuthenticated && access.isStudent && access.hasActiveMembership;
}

export function canEnterInstructorArea(access: CurrentAccess): boolean {
  return access.isAuthenticated && access.isInstructor;
}

export function canEnterAdminArea(access: CurrentAccess): boolean {
  return access.isAuthenticated && access.isAdmin;
}

export function getDefaultAuthenticatedRoute(access: CurrentAccess): string | null {
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
