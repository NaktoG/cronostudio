'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { GuestRoute } from '../components/ProtectedRoute';
import Footer from '../components/Footer';

export default function LoginPage() {
    const router = useRouter();
    const { login, error, clearError, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLocalError('');
        clearError();

        if (!email || !password) {
            setLocalError('Por favor completa todos los campos');
            return;
        }

        try {
            await login(email, password);
            router.push('/');
        } catch {
            // Error ya manejado en el context
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: 'easeOut' },
        },
    };

    return (
        <GuestRoute>
            <div className="min-h-screen bg-black flex flex-col">
                <div className="flex-1 flex items-center justify-center px-4">
                    <motion.div
                        className="w-full max-w-md"
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                    >
                        {/* Logo */}
                        <div className="text-center mb-8">
                            <motion.div
                                className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-2xl mb-4 shadow-lg shadow-yellow-400/20"
                                whileHover={{ scale: 1.05, rotate: 5 }}
                            >
                                <Image
                                    src="/logo_crono.png"
                                    alt="CronoStudio"
                                    width={40}
                                    height={40}
                                    className="w-10 h-10 object-contain"
                                    priority
                                />
                            </motion.div>
                            <h1 className="text-3xl font-bold text-white">CronoStudio</h1>
                            <p className="text-gray-400 mt-2">Inicia sesión en tu cuenta</p>
                        </div>

                        {/* Formulario */}
                        <motion.form
                            onSubmit={handleSubmit}
                            className="bg-gray-900/50 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-8 space-y-6"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {(error || localError) && (
                                <motion.div
                                    className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    {error || localError}
                                </motion.div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                        placeholder="tu@email.com"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                        Contraseña
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                        placeholder="••••••••"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <motion.button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 hover:shadow-lg hover:shadow-yellow-400/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Iniciando sesión...
                                    </span>
                                ) : (
                                    'Iniciar Sesión'
                                )}
                            </motion.button>

                            <div className="text-center text-gray-400 text-sm">
                                <Link href="/forgot-password" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <div className="text-center text-gray-500 text-xs">
                                <Link href="/resend-verification" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                                    Reenviar verificacion de email
                                </Link>
                            </div>

                            <div className="text-center text-gray-400 text-sm">
                                ¿No tienes cuenta?{' '}
                                <Link href="/register" className="text-yellow-400 hover:text-yellow-300 transition-colors">
                                    Regístrate
                                </Link>
                            </div>
                        </motion.form>

                        {/* Demo credentials */}
                        <motion.div
                            className="mt-6 p-4 bg-gray-900/30 rounded-lg border border-yellow-500/10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <p className="text-gray-400 text-xs text-center">
                                Demo email: <span className="text-yellow-400">demo@cronostudio.com</span>
                            </p>
                            <p className="text-gray-400 text-xs text-center mt-1">
                                Demo password: <span className="text-yellow-400">demo123</span>
                            </p>
                        </motion.div>
                    </motion.div>
                </div>
                <Footer />
            </div>
        </GuestRoute>
    );
}
