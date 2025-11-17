'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const auth = createAuthClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await auth.getSession();
      if (session) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    };
    checkAuth();
  }, [auth, router]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
        <p className="text-[#6B7280]">Cargando...</p>
      </div>
    </div>
  );
}