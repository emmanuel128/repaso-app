import type { User, Session, AuthError } from "@supabase/supabase-js";

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
}

// Re-export Supabase types for convenience
export type { User, Session, AuthError };