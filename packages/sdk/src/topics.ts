import type { SupabaseClient } from '@supabase/supabase-js';

export interface Topic {
  id: string;
  tenant_id: string;
  area_id: string;
  name: string;
  slug: string;
  description?: string | null;
  order_index: number;
  status: 'draft' | 'published' | 'archived';
  created_at?: string;
  updated_at?: string;
}

export async function fetchTopics(client: SupabaseClient): Promise<Topic[]> {
  const { data, error } = await client
    .from('topics')
    .select('*')
    .eq('status', 'published')
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Topic[];
}

export async function fetchTopicsByArea(client: SupabaseClient, areaId: string): Promise<Topic[]> {
  const { data, error } = await client
    .from('topics')
    .select('*')
    .eq('area_id', areaId)
    .eq('status', 'published')
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Topic[];
}
