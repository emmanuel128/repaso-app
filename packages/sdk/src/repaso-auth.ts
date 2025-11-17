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
                }
            }
        });

        // If user was created successfully, create profile and tenant association
        if (data.user && !error) {
            const { error: profileError } = await this.createUserProfile(
                data.user, 
                credentials.firstName, 
                credentials.lastName
            );
            
            if (profileError) {
                console.error('Profile creation failed:', profileError);
                // Note: User is still created in auth, but profile creation failed
                // This should be handled gracefully in the UI
            }
        }

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

    async createUserProfile(user: User, firstName?: string, lastName?: string): Promise<{ error: Error | null }> {
        const defaultTenantId = '11111111-1111-1111-1111-111111111111';
        
        try {
            // Insert into profiles table
            const { error: profileError } = await this.client
                .from('profiles')
                .insert({
                    id: user.id,
                    first_name: firstName || user.user_metadata?.first_name || '',
                    last_name: lastName || user.user_metadata?.last_name || ''
                });

            if (profileError) {
                console.error('Error creating profile:', profileError);
                return { error: new Error('Error creating user profile') };
            }

            // Insert into user_tenants table with default tenant
            const { error: tenantError } = await this.client
                .from('user_tenants')
                .insert({
                    user_id: user.id,
                    tenant_id: defaultTenantId,
                    role: 'student'
                });

            if (tenantError) {
                console.error('Error creating user tenant:', tenantError);
                return { error: new Error('Error assigning user to tenant') };
            }

            return { error: null };
        } catch (err) {
            console.error('Error in createUserProfile:', err);
            return { error: new Error('Unexpected error creating user profile') };
        }
    }

    onAuthStateChange(callback: (event: string, session: Session | null) => void) {
        return this.client.auth.onAuthStateChange(callback);
    }
}