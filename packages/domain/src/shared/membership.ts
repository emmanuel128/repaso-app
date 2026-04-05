export type MembershipStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "unpaid"
  | "paused";

export interface Membership {
  id: string;
  user_id: string;
  tenant_id: string;
  status: MembershipStatus;
  current_period_end?: string | null;
  cancel_at?: string | null;
  canceled_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const ACTIVE_MEMBERSHIP_STATUSES: MembershipStatus[] = ["trialing", "active"];

export function hasActiveMembership(membership: Membership | null): boolean {
  return membership ? ACTIVE_MEMBERSHIP_STATUSES.includes(membership.status) : false;
}
