import Header from '../components/Header';
import Footer from '../components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-white">Terminos de servicio</h1>
          <p className="mt-4 text-sm text-slate-300">
            Al usar CronoStudio aceptas estos terminos basicos.
          </p>
          <div className="mt-6 space-y-4 text-sm text-slate-400">
            <p>Uso legitimo: no abuses de la plataforma ni vulneres la seguridad.</p>
            <p>Contenido: sos responsable del contenido que cargues o sincronices.</p>
            <p>Disponibilidad: hacemos nuestro mejor esfuerzo para mantener el servicio operativo.</p>
            <p>Pagos: los planes pagos se facturan segun el ciclo elegido.</p>
            <p>Actualizaciones: los terminos pueden actualizarse para mejorar el servicio.</p>
          </div>
          <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Contacto</p>
            <p className="mt-2 text-sm text-slate-300">Consultas legales:</p>
            <p className="mt-1 text-sm text-yellow-300">legal@atonix.com</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
