'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase';

export default function AuthCallbackPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const auth = createAuthClient();

    useEffect(() => {
        const handleAuthCallback = async () => {
            try {
                // Get the current session after OAuth redirect
                const { session, error: sessionError } = await auth.getSession();
                
                if (sessionError) {
                    setError('Error de autenticación. Por favor, intenta de nuevo.');
                    return;
                }

                if (session?.user) {
                    // Check if user profile exists, if not create it
                    const { error: profileError } = await auth.createUserProfile(session.user);
                    
                    if (profileError) {
                        console.error('Profile creation error:', profileError);
                        // Continue anyway, user is authenticated
                    }

                    // Redirect to dashboard
                    router.push('/dashboard');
                } else {
                    // No session, redirect to login
                    router.push('/login');
                }
            } catch (err) {
                console.error('Auth callback error:', err);
                setError('Error inesperado durante la autenticación.');
            } finally {
                setLoading(false);
            }
        };

        handleAuthCallback();
    }, [auth, router]);

    if (error) {
        return (
            <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                        <div className="w-16 h-16 bg-[#EF4444] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-[#1F2937] mb-4">
                            Error de Autenticación
                        </h2>
                        <p className="text-[#6B7280] mb-6">
                            {error}
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Volver a Iniciar Sesión
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
            <div className="text-center">
                <div className="mb-6">
                    <h1 className="text-4xl font-bold text-[#1F2937] mb-2">
                        Repaso
                    </h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#3B82F6] to-[#A78BFA] mx-auto rounded-full"></div>
                </div>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B82F6] mx-auto mb-4"></div>
                <p className="text-[#6B7280]">Completando autenticación...</p>
            </div>
        </div>
    );
}