import { createRepasoAuth, makeSupabaseClient } from "@repaso/infrastructure";

export const supabaseServer = () =>
    makeSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

let browserClient: ReturnType<typeof makeSupabaseClient> | null = null;

export const supabaseBrowser = () => {
    if (!browserClient) {
        browserClient = makeSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    return browserClient;
};

// Create auth instance for browser
export const createAuthClient = () => {
    const client = supabaseBrowser();
    return createRepasoAuth(client);
};
