import type { SupabaseClient } from '@supabase/supabase-js';

export interface Topic {
  id: string;
  exam_id?: string | null;
  name: string;
  slug: string;
  weight?: number | null;
  created_at?: string;
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
