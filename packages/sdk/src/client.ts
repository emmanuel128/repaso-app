import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function makeClient(url: string, key: string): SupabaseClient {
    return createClient(url, key);
}