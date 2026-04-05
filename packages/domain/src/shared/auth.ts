import type { AuthError, Session, User } from "@supabase/supabase-js";
import type { Membership } from "./membership";
import type { RoleType, TenantContext } from "./roles";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  firstName: string;
  lastName: string;
  confirmPassword: string;
}

export interface AuthResult {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
  tenantId?: string;
}

export interface CurrentAccess {
  loading: boolean;
  user: User | null;
  session: Session | null;
  tenant: TenantContext | null;
  role: RoleType | null;
  membership: Membership | null;
  isAuthenticated: boolean;
  hasActiveMembership: boolean;
  isStudent: boolean;
  isInstructor: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  error: string | null;
}

export type { AuthError, Session, User };
