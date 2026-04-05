import type { Access } from "@repaso/application";
import type { Shared } from "@repaso/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

function normalizeSingleRelation<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export function createSupabaseAccessRepository(client: SupabaseClient): Access.AccessRepository {
  return {
    async fetchCurrentMembership(): Promise<Shared.Membership | null> {
      const { data, error } = await client
        .from("memberships")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      return ((data ?? [])[0] ?? null) as Shared.Membership | null;
    },

    async fetchCurrentTenantRole(
      userId: string
    ): Promise<{ tenant: Shared.TenantContext; role: Shared.RoleType } | null> {
      const { data, error } = await client
        .from("user_tenants")
        .select("tenant_id, role, tenants(name, slug, is_active)")
        .eq("user_id", userId)
        .limit(1);

      if (error) {
        throw error;
      }

      const row = (data ?? [])[0] as
        | {
            tenant_id: string;
            role: Shared.RoleType;
            tenants?: { name: string; slug: string; is_active: boolean }[] | { name: string; slug: string; is_active: boolean } | null;
          }
        | undefined;

      if (!row) {
        return null;
      }

      const tenant = normalizeSingleRelation(row.tenants);

      return {
        role: row.role,
        tenant: {
          id: row.tenant_id,
          name: tenant?.name ?? "Tenant",
          slug: tenant?.slug ?? "tenant",
          isActive: tenant?.is_active ?? true,
        },
      };
    },
  };
}
