"use client";

import { useEffect, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Area } from './areas';
import type { Topic } from './topics';
import { fetchAreas } from './areas';
import { fetchTopics } from './topics';

export interface AreaWithTopics extends Area {
  topics: Topic[];
}

export function useAreasWithTopics(client: SupabaseClient) {
  const [areas, setAreas] = useState<AreaWithTopics[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([fetchAreas(client), fetchTopics(client)])
      .then(([areasList, topicsList]) => {
        if (!mounted) return;
        const topicsByArea: Record<string, Topic[]> = {};
        for (const t of topicsList) {
          const key = (t as any).area_id as string; // schema includes area_id
          if (!topicsByArea[key]) topicsByArea[key] = [];
          topicsByArea[key].push(t);
        }
        const combined: AreaWithTopics[] = areasList.map((a) => ({
          ...a,
          topics: topicsByArea[a.id] ?? [],
        }));
        setAreas(combined);
        setError(null);
      })
      .catch((err) => {
        if (mounted) setError(err?.message ?? 'Error fetching areas/topics');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [client]);

  return { areas, loading, error };
}
