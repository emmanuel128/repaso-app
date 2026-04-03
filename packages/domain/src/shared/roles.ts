export type RoleType = "owner" | "admin" | "instructor" | "student";

export interface TenantContext {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
}

export interface UserTenantRole {
  tenant: TenantContext;
  role: RoleType;
}

export function isStudentRole(role: RoleType | null): boolean {
  return role === "student";
}

export function isInstructorRole(role: RoleType | null): boolean {
  return role === "instructor";
}

export function isAdminRole(role: RoleType | null): boolean {
  return role === "owner" || role === "admin";
}
