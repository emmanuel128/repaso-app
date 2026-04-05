import { Shared as InfrastructureShared } from "@repaso/infrastructure";

export const supabaseServer = () =>
    InfrastructureShared.makeSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

let browserClient: ReturnType<typeof InfrastructureShared.makeSupabaseClient> | null = null;

export const supabaseBrowser = () => {
    if (!browserClient) {
        browserClient = InfrastructureShared.makeSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    return browserClient;
};

// Create auth instance for browser
export const createAuthClient = () => {
    const client = supabaseBrowser();
    return InfrastructureShared.createRepasoAuth(client);
};
