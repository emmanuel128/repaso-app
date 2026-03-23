import type { User, Session, AuthError } from "@supabase/supabase-js";

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignUpCredentials extends LoginCredentials {
    firstName: string;
    lastName: string;
    confirmPassword: string;
    // for multitenancy support later
}

export interface AuthResult {
    user: User | null;
    session: Session | null;
    error: AuthError | null;
    tenantId?: string;
}

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

// Tenant-related types
export interface TenantConfig {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    settings?: {
        logoUrl?: string;
        brandPrimary?: string;
        brandSecondary?: string;
        features?: Record<string, any>;
    };
}

// Re-export Supabase types for convenience
export type { User, Session, AuthError };
