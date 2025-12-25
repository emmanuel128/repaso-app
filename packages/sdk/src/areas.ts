import type { SupabaseClient } from '@supabase/supabase-js';

export interface Area {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string | null;
  order_index: number;
  status: 'draft' | 'published' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export async function fetchAreas(client: SupabaseClient): Promise<Area[]> {
    console.log("Fetching areas...");
    // console.log("Client:", client);
  const { data, error } = await client
    .from('areas')
    .select('*')
    .eq('status', 'published')
    .order('order_index', { ascending: true });

  if (error) throw error;
  return (data ?? []) as Area[];
}
