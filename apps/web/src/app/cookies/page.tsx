import Header from '../components/Header';
import Footer from '../components/Footer';

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-white">Politica de cookies</h1>
          <p className="mt-4 text-sm text-slate-300">
            Usamos cookies para autenticacion, seguridad y experiencia de usuario.
          </p>
          <div className="mt-6 space-y-4 text-sm text-slate-400">
            <p>Cookies esenciales: necesarias para iniciar sesion y mantener la sesion.</p>
            <p>Preferencias: guardan configuraciones basicas de la app.</p>
            <p>Analiticas: mediciones agregadas para mejorar la experiencia.</p>
            <p>Podes borrar cookies desde tu navegador cuando quieras.</p>
          </div>
          <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Contacto</p>
            <p className="mt-2 text-sm text-slate-300">Consultas sobre cookies:</p>
            <p className="mt-1 text-sm text-yellow-300">support@atonix.com</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
