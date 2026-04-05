export interface AuthGateway {
  getSession(): Promise<{ session: import("@repaso/domain").Shared.Session | null; error: Error | null }>;
  getUser(): Promise<{ user: import("@repaso/domain").Shared.User | null; error: Error | null }>;
}

export interface AccessRepository {
  fetchCurrentMembership(): Promise<import("@repaso/domain").Shared.Membership | null>;
  fetchCurrentTenantRole(
    userId: string
  ): Promise<{ tenant: import("@repaso/domain").Shared.TenantContext; role: import("@repaso/domain").Shared.RoleType } | null>;
}

export interface CurrentAccessDependencies {
  authGateway: AuthGateway;
  accessRepository: AccessRepository;
}
