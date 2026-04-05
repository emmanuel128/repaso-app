import { Access as DomainAccess, Shared as DomainShared } from "@repaso/domain";
import type { AccessRepository, CurrentAccessDependencies } from "./types";

function buildAccessState(
  session: DomainShared.Session | null,
  user: DomainShared.User | null,
  membership: DomainShared.Membership | null,
  tenantRole: { tenant: DomainShared.TenantContext; role: DomainShared.RoleType } | null,
  error: string | null
): DomainShared.CurrentAccess {
  const role = tenantRole?.role ?? null;
  const tenant = tenantRole?.tenant ?? null;
  const activeMembership = DomainShared.hasActiveMembership(membership);

  return {
    loading: false,
    user,
    session,
    tenant,
    role,
    membership,
    isAuthenticated: Boolean(session && user),
    hasActiveMembership: activeMembership,
    isStudent: DomainAccess.isStudentRole(role),
    isInstructor: DomainAccess.isInstructorRole(role),
    isAdmin: DomainAccess.isAdminRole(role),
    isOwner: DomainAccess.isOwnerRole(role),
    error,
  };
}

async function fetchTenantRole(
  repository: AccessRepository,
  user: DomainShared.User | null
): Promise<{ tenant: DomainShared.TenantContext; role: DomainShared.RoleType } | null> {
  if (!user) {
    return null;
  }

  return repository.fetchCurrentTenantRole(user.id);
}

export async function resolveCurrentAccess(
  dependencies: CurrentAccessDependencies
): Promise<DomainShared.CurrentAccess> {
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

    const tenantRole = await fetchTenantRole(dependencies.accessRepository, user);

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
