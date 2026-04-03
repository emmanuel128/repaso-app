import type { AuthGateway } from "@repaso/application";
import type { AuthResult, LoginCredentials, SignUpCredentials, User, Session } from "@repaso/domain";
import type { AuthError, SupabaseClient } from "@supabase/supabase-js";

export class RepasoAuth implements AuthGateway {
  constructor(private readonly client: SupabaseClient) {}

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
        },
      },
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

  async getUser(): Promise<{ user: User | null; error: Error | null }> {
    const { data, error } = await this.client.auth.getUser();
    return { user: data.user, error };
  }

  async getSession(): Promise<{ session: Session | null; error: Error | null }> {
    const { data, error } = await this.client.auth.getSession();
    return { session: data.session, error };
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange(callback);
  }
}

export function createRepasoAuth(client: SupabaseClient): RepasoAuth {
  return new RepasoAuth(client);
}
