import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export function makeSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key);
}
