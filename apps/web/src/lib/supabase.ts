import { makeClient, RepasoAuth } from "@repaso/sdk";

export const supabaseServer = () =>
    makeClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );

let browserClient: ReturnType<typeof makeClient> | null = null;

export const supabaseBrowser = () => {
    if (!browserClient) {
        browserClient = makeClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
    }

    return browserClient;
};

// Create auth instance for browser
export const createAuthClient = () => {
    const client = supabaseBrowser();
    return new RepasoAuth(client);
};
