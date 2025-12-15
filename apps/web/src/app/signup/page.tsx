'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase';
import type { SignUpCredentials, AuthError } from '@repaso/sdk';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function SignUpPage() {
    const [credentials, setCredentials] = useState<SignUpCredentials>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
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

    const validateForm = (): string | null => {
        if (!credentials.firstName.trim()) {
            return 'El nombre es requerido';
        }

        if (!credentials.lastName.trim()) {
            return 'El apellido es requerido';
        }

        if (!credentials.email.trim()) {
            return 'El correo electrónico es requerido';
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(credentials.email)) {
            return 'Por favor ingresa un correo electrónico válido';
        }

        if (credentials.password.length < 6) {
            return 'La contraseña debe tener al menos 6 caracteres';
        }

        if (credentials.password !== credentials.confirmPassword) {
            return 'Las contraseñas no coinciden';
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        try {
            const { user, error: authError } = await auth.signUp(credentials);

            if (authError) {
                setError(authError.message);
            } else if (user) {
                setSuccess(true);
                // Note: User might need to verify email depending on Supabase settings
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

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="fixed top-4 right-4 z-50">
                    <ThemeSwitcher />
                </div>
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-semibold text-foreground mb-4">
                            ¡Cuenta Creada!
                        </h2>
                        <p className="text-text-secondary mb-6">
                            Tu cuenta ha sido creada exitosamente. Revisa tu correo electrónico para verificar tu cuenta.
                        </p>
                        <button
                            onClick={() => router.push('/login')}
                            className="w-full bg-primary hover:bg-secondary text-white font-medium py-3 px-4 rounded-lg transition-colors"
                        >
                            Ir a Iniciar Sesión
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="fixed top-4 right-4 z-50">
                <ThemeSwitcher />
            </div>
            <div className="max-w-md w-full">
                {/* Logo and Title */}
                <div className="text-center mb-8">
                    <div className="mb-6">
                        <h1 className="text-4xl font-bold text-foreground mb-2">
                            Repaso
                        </h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
                    </div>
                    <h2 className="text-2xl font-semibold text-foreground mb-2">
                        Crear Cuenta
                    </h2>
                    <p className="text-text-secondary">
                        Únete a la preparación para la Reválida
                    </p>
                </div>

                {/* Sign Up Form */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-error/10 border border-error rounded-lg p-4">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-error mr-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-error text-sm font-medium">{error}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="firstName" className="block text-sm font-medium text-foreground mb-2">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={credentials.firstName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 bg-background hover:bg-white"
                                    placeholder="Tu nombre"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="block text-sm font-medium text-foreground mb-2">
                                    Apellido(s)
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={credentials.lastName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 bg-background hover:bg-white"
                                    placeholder="Tus apellidos"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                Correo Electrónico
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={credentials.email}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 bg-background hover:bg-white"
                                placeholder="ejemplo@correo.com"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={credentials.password}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 bg-background hover:bg-white"
                                placeholder="Mínimo 6 caracteres"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                                Confirmar Contraseña
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={credentials.confirmPassword}
                                onChange={handleInputChange}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 bg-background hover:bg-white"
                                placeholder="Confirma tu contraseña"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="terms"
                                    name="terms"
                                    type="checkbox"
                                    required
                                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="terms" className="text-text-secondary">
                                    Acepto los{' '}
                                    <a href="#" className="font-medium text-primary hover:text-secondary transition-colors">
                                        términos y condiciones
                                    </a>{' '}
                                    y la{' '}
                                    <a href="#" className="font-medium text-primary hover:text-secondary transition-colors">
                                        política de privacidad
                                    </a>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creando cuenta...
                                </div>
                            ) : (
                                'Crear Cuenta'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-text-secondary">
                            ¿Ya tienes cuenta?{' '}
                            <a href="/login" className="font-medium text-primary hover:text-secondary transition-colors">
                                Inicia sesión aquí
                            </a>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-text-secondary">
                        © 2025 Repaso. Todos los derechos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}