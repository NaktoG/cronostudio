'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Sparkles, Wand2, Youtube, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GuestRoute } from '../components/ProtectedRoute';
import Footer from '../components/Footer';

export default function LoginPage() {
    const router = useRouter();
    const { login, error, clearError, isLoading } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

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
            router.push('/dashboard');
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
            <div className="min-h-screen flex flex-col relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
                    <div className="absolute top-1/3 -right-32 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl" />
                    <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-orange-500/10 blur-3xl" />
                </div>
                <div className="flex-1 flex items-center justify-center px-4 py-12 relative">
                    <motion.div
                        className="w-full max-w-6xl grid gap-10 lg:grid-cols-[1.05fr_0.95fr]"
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                    >
                        <div className="space-y-8">
                            <div>
                                <motion.div
                                    className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-yellow-300"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Estudio creativo
                                </motion.div>
                                <h1 className="mt-6 text-4xl sm:text-5xl font-semibold text-white leading-tight">
                                    CronoStudio convierte tu canal en un sistema de produccion
                                </h1>
                                <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-xl">
                                    Centraliza ideas, guiones, miniaturas y SEO con automatizaciones que reducen friccion y te
                                    devuelven tiempo creativo.
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
                                    <Wand2 className="h-5 w-5 text-yellow-300" />
                                    <h3 className="mt-3 text-sm font-semibold text-white">Para que sirve</h3>
                                    <p className="mt-2 text-sm text-slate-400">
                                        Disenar un pipeline claro para publicar con consistencia y sin perder el control.
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
                                    <Zap className="h-5 w-5 text-yellow-300" />
                                    <h3 className="mt-3 text-sm font-semibold text-white">Resultados visibles</h3>
                                    <p className="mt-2 text-sm text-slate-400">
                                        Seguimiento semanal de metas y alertas para corregir el rumbo a tiempo.
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-6">
                                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-slate-400">
                                    <Youtube className="h-4 w-4 text-red-400" />
                                    Como funciona
                                </div>
                                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                                    {[
                                        { title: 'Conecta', text: 'Autoriza YouTube y define tu canal.' },
                                        { title: 'Planifica', text: 'Idea, guion, SEO y miniatura con flujo claro.' },
                                        { title: 'Automatiza', text: 'Sincroniza videos y analytics sin tocar APIs.' },
                                    ].map((step, index) => (
                                        <div key={step.title} className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
                                            <div className="text-xs text-yellow-300">Paso {index + 1}</div>
                                            <div className="mt-2 text-sm font-semibold text-white">{step.title}</div>
                                            <div className="mt-2 text-xs text-slate-400">{step.text}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            {/* Logo */}
                            <div className="text-center mb-8">
                                <motion.div
                                    className="inline-flex items-center justify-center w-20 h-20 sm:w-[88px] sm:h-[88px] bg-yellow-400 rounded-[22px] sm:rounded-[24px] mb-4 shadow-[0_0_30px_rgba(246,201,69,0.25)] ring-2 ring-black/50"
                                    whileHover={{ scale: 1.05, rotate: 5 }}
                                >
                                    <Image
                                        src="/crono-mark-dark.svg"
                                        alt="CronoStudio"
                                        width={72}
                                        height={72}
                                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                                        priority
                                    />
                                </motion.div>
                                <h2 className="text-3xl font-bold text-white">CronoStudio</h2>
                                <p className="text-gray-400 mt-2">Inicia sesion en tu cuenta</p>
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
                                    <div className="relative">
                                        <input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 pr-12 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                                            placeholder="••••••••"
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword((prev) => !prev)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-300 transition-colors"
                                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                            disabled={isLoading}
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
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
                        </div>

                    </motion.div>
                </div>
                <Footer />
            </div>
        </GuestRoute>
    );
}
