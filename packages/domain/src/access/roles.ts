import type { RoleType } from "../shared/roles";

export function isStudentRole(role: RoleType | null): boolean {
  return role === "student";
}

export function isInstructorRole(role: RoleType | null): boolean {
  return role === "instructor";
}

export function isAdminRole(role: RoleType | null): boolean {
  return role === "owner" || role === "admin";
}

export function isOwnerRole(role: RoleType | null): boolean {
  return role === "owner";
}
