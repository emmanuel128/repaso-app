import { makeClient, RepasoAuth } from "@repaso/sdk";

export const supabaseServer = makeClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export const supabaseBrowser = () =>
    makeClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

// Create auth instance for browser
export const createAuthClient = () => {
    const client = supabaseBrowser();
    return new RepasoAuth(client);
};