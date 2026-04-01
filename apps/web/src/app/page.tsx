'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const auth = createAuthClient();
      const { session } = await auth.getSession();

      if (session) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-text-secondary">Cargando...</p>
      </div>
    </div>
  );
}
