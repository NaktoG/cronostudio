'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { PageTransition } from '../components/Animations';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';

interface Perfil {
  name: string;
  email: string;
}

export default function ConfiguracionPage() {
  const { logout, user } = useAuth();
  const authFetch = useAuthFetch();
  const router = useRouter();

  const [perfil, setPerfil] = useState<Perfil>({ name: '', email: '' });
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [mensajePerfil, setMensajePerfil] = useState<string | null>(null);
  const [mensajePassword, setMensajePassword] = useState<string | null>(null);
  const [mensajeRecuperacion, setMensajeRecuperacion] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmacion, setPasswordConfirmacion] = useState('');
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await authFetch('/api/auth/profile');
        if (!response.ok) throw new Error('No pudimos cargar tu perfil');
        const data = await response.json();
        setPerfil({ name: data.user.name, email: data.user.email });
      } catch (error) {
        console.error(error);
        setErrorGeneral('No pudimos obtener tu información. Intenta más tarde.');
      } finally {
        setCargandoPerfil(false);
      }
    };
    cargar();
  }, [authFetch]);

  const guardarPerfil = async () => {
    setMensajePerfil(null);
    setErrorGeneral(null);
    try {
      const respuesta = await authFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: perfil.name, email: perfil.email }),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.error || 'No pudimos guardar los cambios');
      }
      setMensajePerfil('Datos actualizados correctamente');
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : 'Error al guardar el perfil');
    }
  };

  const cambiarPassword = async () => {
    setMensajePassword(null);
    setErrorGeneral(null);
    if (passwordNueva !== passwordConfirmacion) {
      setErrorGeneral('La confirmación no coincide con la nueva contraseña');
      return;
    }
    try {
      const respuesta = await authFetch('/api/auth/password', {
        method: 'POST',
        body: JSON.stringify({ passwordActual, passwordNueva }),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.error || 'No pudimos actualizar la contraseña');
      }
      setMensajePassword('Contraseña actualizada');
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmacion('');
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : 'No pudimos actualizar la contraseña');
    }
  };

  const enviarRecuperacion = async () => {
    setMensajeRecuperacion(null);
    try {
      const respuesta = await authFetch('/api/auth/request-password-reset', {
        method: 'POST',
        body: JSON.stringify({ email: perfil.email }),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.error || 'No pudimos enviar el correo');
      }
      setMensajeRecuperacion('Te enviamos un correo con instrucciones de recuperación');
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : 'No pudimos enviar el correo de recuperación');
    }
  };

  const eliminarCuenta = async () => {
    if (textoConfirmacion.trim().toUpperCase() !== 'ELIMINAR') {
      setErrorGeneral('Escribe ELIMINAR para confirmar');
      return;
    }
    setEliminando(true);
    setErrorGeneral(null);
    try {
      const respuesta = await authFetch('/api/auth/profile', { method: 'DELETE' });
      const data = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        throw new Error(data.error || 'No pudimos eliminar la cuenta');
      }
      logout();
      router.replace('/login');
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : 'No pudimos eliminar la cuenta');
    } finally {
      setEliminando(false);
    }
  };

  const contenido = (
    <div className="space-y-6">
      <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Perfil</h2>
        <p className="text-sm text-gray-400 mb-6">Administra tu nombre y correo. Todo el panel está ahora en español.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-400">Nombre</label>
            <input
              type="text"
              value={perfil.name}
              onChange={(e) => setPerfil((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full mt-1 rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Correo</label>
            <input
              type="email"
              value={perfil.email}
              onChange={(e) => setPerfil((prev) => ({ ...prev, email: e.target.value }))}
              className="w-full mt-1 rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>
        </div>
        <motion.button
          onClick={guardarPerfil}
          className="mt-4 px-5 py-2.5 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300"
          whileHover={{ scale: 1.02 }}
        >
          Guardar cambios
        </motion.button>
        {mensajePerfil && <p className="text-sm text-green-400 mt-3">{mensajePerfil}</p>}
      </section>

      <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Seguridad</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-gray-400">Contraseña actual</label>
            <input
              type="password"
              value={passwordActual}
              onChange={(e) => setPasswordActual(e.target.value)}
              className="w-full mt-1 rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Nueva contraseña</label>
            <input
              type="password"
              value={passwordNueva}
              onChange={(e) => setPasswordNueva(e.target.value)}
              className="w-full mt-1 rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">Confirmar nueva</label>
            <input
              type="password"
              value={passwordConfirmacion}
              onChange={(e) => setPasswordConfirmacion(e.target.value)}
              className="w-full mt-1 rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>
        </div>
        <motion.button
          onClick={cambiarPassword}
          className="mt-4 px-5 py-2.5 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300"
          whileHover={{ scale: 1.02 }}
        >
          Actualizar contraseña
        </motion.button>
        {mensajePassword && <p className="text-sm text-green-400 mt-3">{mensajePassword}</p>}
      </section>

      <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Recuperación</h2>
        <p className="text-sm text-gray-400 mb-4">¿Perdiste el acceso? Podemos enviarte un enlace para restablecer la cuenta.</p>
        <motion.button
          onClick={enviarRecuperacion}
          className="px-5 py-2.5 bg-gray-200 text-black font-semibold rounded-lg hover:bg-white"
          whileHover={{ scale: 1.02 }}
        >
          Enviar enlace de recuperación
        </motion.button>
        {mensajeRecuperacion && <p className="text-sm text-green-400 mt-3">{mensajeRecuperacion}</p>}
      </section>

      <section className="bg-red-950/40 border border-red-900 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Eliminar cuenta</h2>
        <p className="text-sm text-red-300 mb-4">Esta acción eliminará todos tus datos. No se puede deshacer.</p>
        <label className="text-sm text-gray-400">Escribe ELIMINAR para confirmar</label>
        <input
          type="text"
          value={textoConfirmacion}
          onChange={(e) => setTextoConfirmacion(e.target.value)}
          className="w-full mt-1 rounded-lg bg-gray-900/60 border border-red-800 px-3 py-2 text-white focus:border-red-500 focus:outline-none"
        />
        <motion.button
          onClick={eliminarCuenta}
          disabled={eliminando}
          className="mt-4 px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-500 disabled:opacity-50"
          whileHover={{ scale: eliminando ? 1 : 1.02 }}
        >
          {eliminando ? 'Eliminando...' : 'Eliminar mi cuenta'}
        </motion.button>
      </section>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <PageTransition className="flex-1">
          <main className="w-full px-4 md:px-8 lg:px-12 py-8">
            <motion.div className="mb-8 space-y-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <BackToDashboard />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white">Configuración</h1>
                <p className="text-gray-400">Administra tu cuenta personal de CronoStudio.</p>
                {user && <p className="text-sm text-gray-500 mt-1">Sesión iniciada como {user.email}</p>}
              </div>
            </motion.div>
            {cargandoPerfil ? (
              <div className="flex justify-center py-20">
                <motion.div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              </div>
            ) : (
              contenido
            )}
            {errorGeneral && <p className="text-sm text-red-400 mt-6">{errorGeneral}</p>}
          </main>
        </PageTransition>
        <Footer />
      </div>
    </ProtectedRoute>
  );
}
