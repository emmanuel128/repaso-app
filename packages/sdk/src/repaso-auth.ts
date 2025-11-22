import { SupabaseClient, AuthError } from "@supabase/supabase-js";
import type { LoginCredentials, SignUpCredentials, AuthResult, User, Session } from "./types";

export class RepasoAuth {
    private client: SupabaseClient;

    constructor(client: SupabaseClient) {
        this.client = client;
    }

    async signIn(credentials: LoginCredentials): Promise<AuthResult> {
        const { data, error } = await this.client.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });

        return {
            user: data.user,
            session: data.session,
            error,
        };
    }

    async signUp(credentials: SignUpCredentials): Promise<AuthResult> {
        const fullName = `${credentials.firstName} ${credentials.lastName}`.trim();

        const { data, error } = await this.client.auth.signUp({
            email: credentials.email,
            password: credentials.password,
            options: {
                data: {
                    first_name: credentials.firstName,
                    last_name: credentials.lastName,
                    full_name: fullName,
                    // tenant_id: null, // add multitenancy support later
                }
            }
        });

        return {
            user: data.user,
            session: data.session,
            error,
        };
    }

    async signOut(): Promise<{ error: AuthError | null }> {
        const { error } = await this.client.auth.signOut();
        return { error };
    }

    async getUser(): Promise<{ user: User | null; error: AuthError | null }> {
        const { data, error } = await this.client.auth.getUser();
        return { user: data.user, error };
    }

    async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
        const { data, error } = await this.client.auth.getSession();
        return { session: data.session, error };
    }


    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        return this.client.auth.onAuthStateChange(callback);
    }
}