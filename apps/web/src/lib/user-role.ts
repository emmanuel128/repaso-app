import type { RoleType } from "@repaso/domain";

export type UserRole = "Owner" | "Admin" | "Instructor" | "Student";

const ROLE_MAP: Record<RoleType, UserRole> = {
  owner: "Owner",
  admin: "Admin",
  instructor: "Instructor",
  student: "Student",
};

export function toUserRole(role: RoleType | null): UserRole | null {
  if (!role) {
    return null;
  }

  return ROLE_MAP[role];
}
