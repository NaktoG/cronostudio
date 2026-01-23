'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <motion.footer
            className="bg-black border-t border-yellow-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
        >
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Logo y descripción */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                                <span className="text-black font-bold text-lg">C</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">CronoStudio</h3>
                        </div>
                        <p className="text-gray-400 text-sm max-w-md">
                            Automatiza la gestión de tus canales de YouTube.
                            Analiza métricas, programa contenido y optimiza tu crecimiento.
                        </p>
                    </div>

                    {/* Links rápidos */}
                    <div>
                        <h4 className="text-yellow-400 font-semibold mb-4">Navegación</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link href="/channels" className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                                    Canales
                                </Link>
                            </li>
                            <li>
                                <Link href="/analytics" className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                                    Analytics
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Info */}
                    <div>
                        <h4 className="text-yellow-400 font-semibold mb-4">Soporte</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                                    Documentación
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                                    API
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-400 hover:text-yellow-400 transition-colors text-sm">
                                    Contacto
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © {currentYear} CronoStudio. Todos los derechos reservados.
                    </p>
                    <div className="flex items-center gap-4">
                        <span className="text-xs text-gray-600">Hecho con</span>
                        <span className="text-yellow-400">⚡</span>
                    </div>
                </div>
            </div>
        </motion.footer>
    );
}
