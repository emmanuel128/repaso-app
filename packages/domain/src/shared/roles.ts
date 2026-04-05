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
