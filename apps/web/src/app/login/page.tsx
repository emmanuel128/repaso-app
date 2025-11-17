'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase';
import type { LoginCredentials, AuthError } from '@repaso/sdk';

export default function LoginPage() {
    const [credentials, setCredentials] = useState<LoginCredentials>({
        email: '',
        password: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const auth = createAuthClient();

    useEffect(() => {
        // Check if user is already authenticated
        const checkAuth = async () => {
            const { session } = await auth.getSession();
            if (session) {
                router.push('/dashboard');
            }
        };
        checkAuth();
    }, [auth, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { user, error: authError } = await auth.signIn(credentials);
            
            if (authError) {
                setError(authError.message);
            } else if (user) {
                router.push('/dashboard');
            }
        } catch (err) {
            setError('Error inesperado. Por favor, intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="mb-6">
                        <h1 className="text-4xl font-bold text-[#1F2937] mb-2">
                            Repaso
                        </h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-[#3B82F6] to-[#A78BFA] mx-auto rounded-full"></div>
                    </div>
                    <h2 className="text-2xl font-semibold text-[#1F2937] mb-2">
                        Iniciar Sesión
                    </h2>
                    <p className="text-[#6B7280]">
                        Preparación para la Reválida de Psicología
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-lg p-4">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-[#EF4444] mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-[#EF4444] text-sm font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[#1F2937] mb-2">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={credentials.email}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all duration-200 bg-[#F9FAFB] hover:bg-white"
                                placeholder="ejemplo@correo.com"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-[#1F2937] mb-2">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={credentials.password}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent outline-none transition-all duration-200 bg-[#F9FAFB] hover:bg-white"
                                placeholder="••••••••"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    name="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 text-[#3B82F6] focus:ring-[#3B82F6] border-gray-300 rounded"
                                />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-[#6B7280]">
                                    Recordarme
                                </label>
                            </div>

                            <div className="text-sm">
                                <a href="#" className="font-medium text-[#3B82F6] hover:text-[#2563EB] transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Iniciando sesión...
                                </div>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-[#6B7280]">
                            ¿No tienes cuenta?{' '}
                            <a href="/signup" className="font-medium text-[#3B82F6] hover:text-[#2563EB] transition-colors">
                                Regístrate aquí
                            </a>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-[#6B7280]">
                        © 2025 Repaso. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}