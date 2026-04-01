import type { SupabaseClient } from "@supabase/supabase-js";
import type { Membership, MembershipStatus } from "./types";

export const ACTIVE_MEMBERSHIP_STATUSES: MembershipStatus[] = ["trialing", "active"];

export async function fetchMemberships(client: SupabaseClient): Promise<Membership[]> {
  const { data, error } = await client
    .from("memberships")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Membership[];
}

export async function fetchCurrentMembership(client: SupabaseClient): Promise<Membership | null> {
  const memberships = await fetchMemberships(client);
  return memberships[0] ?? null;
}

export function hasStudentAccess(membership: Membership | null): boolean {
  return membership ? ACTIVE_MEMBERSHIP_STATUSES.includes(membership.status) : false;
}
