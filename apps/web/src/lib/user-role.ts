import type { Shared as DomainShared } from "@repaso/domain";

export type UserRole = "Owner" | "Admin" | "Instructor" | "Student";

const ROLE_MAP: Record<DomainShared.RoleType, UserRole> = {
  owner: "Owner",
  admin: "Admin",
  instructor: "Instructor",
  student: "Student",
};

export function toUserRole(role: DomainShared.RoleType | null): UserRole | null {
  if (!role) {
    return null;
  }

  return ROLE_MAP[role];
}
