import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 xl:px-14 py-12">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-white">Politica de privacidad</h1>
          <p className="mt-4 text-sm text-slate-300">
            Respetamos tu privacidad. Solo recopilamos datos necesarios para operar CronoStudio
            (cuenta, configuraciones, contenido y analiticas). No vendemos tus datos.
          </p>
          <div className="mt-6 space-y-4 text-sm text-slate-400">
            <p>Datos que recolectamos: email, nombre, configuracion del canal y actividad en la app.</p>
            <p>Uso de datos: autenticacion, personalizacion, soporte y mejoras del producto.</p>
            <p>Seguridad: cifrado y controles de acceso para proteger tu informacion.</p>
            <p>Retencion: conservamos datos mientras tengas cuenta o por requerimientos legales.</p>
            <p>Derechos: podes solicitar acceso, correccion o eliminacion de tus datos.</p>
          </div>
          <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Contacto</p>
            <p className="mt-2 text-sm text-slate-300">Privacidad y datos personales:</p>
            <p className="mt-1 text-sm text-yellow-300">privacy@atonix.com</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
