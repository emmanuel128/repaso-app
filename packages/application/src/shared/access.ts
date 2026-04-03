import {
  hasActiveMembership,
  isAdminRole,
  isInstructorRole,
  isStudentRole,
} from "@repaso/domain";
import type {
  CurrentAccess,
  Membership,
  RoleType,
  Session,
  TenantContext,
  User,
} from "@repaso/domain";

export interface AuthGateway {
  getSession(): Promise<{ session: Session | null; error: Error | null }>;
  getUser(): Promise<{ user: User | null; error: Error | null }>;
}

export interface AccessRepository {
  fetchCurrentMembership(): Promise<Membership | null>;
  fetchCurrentTenantRole(userId: string): Promise<{ tenant: TenantContext; role: RoleType } | null>;
}

export interface CurrentAccessDependencies {
  authGateway: AuthGateway;
  accessRepository: AccessRepository;
}

function buildAccessState(
  session: Session | null,
  user: User | null,
  membership: Membership | null,
  tenantRole: { tenant: TenantContext; role: RoleType } | null,
  error: string | null
): CurrentAccess {
  const role = tenantRole?.role ?? null;
  const tenant = tenantRole?.tenant ?? null;
  const activeMembership = hasActiveMembership(membership);

  return {
    loading: false,
    user,
    session,
    tenant,
    role,
    membership,
    isAuthenticated: Boolean(session && user),
    hasActiveMembership: activeMembership,
    isStudent: isStudentRole(role),
    isInstructor: isInstructorRole(role),
    isAdmin: isAdminRole(role),
    error,
  };
}

export async function resolveCurrentAccess(
  dependencies: CurrentAccessDependencies
): Promise<CurrentAccess> {
  try {
    const { session, error: sessionError } = await dependencies.authGateway.getSession();

    if (sessionError) {
      throw sessionError;
    }

    if (!session) {
      return buildAccessState(null, null, null, null, null);
    }

    const [{ user, error: userError }, membership] = await Promise.all([
      dependencies.authGateway.getUser(),
      dependencies.accessRepository.fetchCurrentMembership(),
    ]);

    if (userError) {
      throw userError;
    }

    const tenantRole = user
      ? await dependencies.accessRepository.fetchCurrentTenantRole(user.id)
      : null;

    return buildAccessState(session, user, membership, tenantRole, null);
  } catch (error) {
    return buildAccessState(
      null,
      null,
      null,
      null,
      error instanceof Error ? error.message : "No fue posible validar tu acceso."
    );
  }
}
