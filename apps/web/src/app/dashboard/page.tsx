'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase';
import type { User } from '@repaso/sdk';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const auth = createAuthClient();

    useEffect(() => {
        const checkAuth = async () => {
            const { session } = await auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const { user } = await auth.getUser();
            setUser(user);
            setLoading(false);
        };

        checkAuth();
    }, [auth, router]);

    const handleSignOut = async () => {
        await auth.signOut();
        router.push('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-text-secondary">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-foreground">Repaso</h1>
                            <div className="w-16 h-1 bg-gradient-to-r from-primary to-accent ml-2 rounded-full"></div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <span className="text-text-secondary text-sm">
                                Bienvenido, {user?.email}
                            </span>
                            <ThemeSwitcher />
                            <button
                                onClick={handleSignOut}
                                className="text-primary hover:text-secondary text-sm font-medium transition-colors"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 mb-8 text-white">
                    <h2 className="text-3xl font-bold mb-4">
                        ¡Bienvenido a Repaso!
                    </h2>
                    <p className="text-lg opacity-90">
                        Tu plataforma de preparación para la Reválida de Psicología en Puerto Rico
                    </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center">
                            <div className="bg-primary/10 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-foreground">Preguntas Completadas</h3>
                                <p className="text-2xl font-bold text-primary">0</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center">
                            <div className="bg-success/10 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-foreground">Progreso</h3>
                                <p className="text-2xl font-bold text-success">0%</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center">
                            <div className="bg-accent/10 p-3 rounded-lg">
                                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-semibold text-foreground">Tiempo Estudiado</h3>
                                <p className="text-2xl font-bold text-accent">0h</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-xl font-semibold text-foreground mb-4">Comenzar Práctica</h3>
                        <p className="text-text-secondary mb-6">
                            Practica con preguntas de la Reválida organizadas por temas
                        </p>
                        <button className="w-full bg-primary hover:bg-secondary text-white font-medium py-3 px-4 rounded-lg transition-colors">
                            Iniciar Práctica
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-xl font-semibold text-foreground mb-4">Examen Simulacro</h3>
                        <p className="text-text-secondary mb-6">
                            Toma un examen completo bajo condiciones similares a la Reválida
                        </p>
                        <button className="w-full bg-accent hover:bg-secondary text-white font-medium py-3 px-4 rounded-lg transition-colors">
                            Comenzar Simulacro
                        </button>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-xl font-semibold text-foreground mb-4">Actividad Reciente</h3>
                    <div className="text-center py-8">
                        <svg className="w-12 h-12 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-text-secondary">No hay actividad reciente</p>
                        <p className="text-sm text-text-secondary mt-2">Comienza a practicar para ver tu progreso aquí</p>
                    </div>
                </div>
            </main>
        </div>
    );
}