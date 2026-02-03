'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

type GoogleCredentialResponse = { credential: string };

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleLoginButtonProps {
  texto?: string;
}

export function GoogleLoginButton({ texto = 'Continuar con Google' }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) {
      setError('Configura NEXT_PUBLIC_GOOGLE_CLIENT_ID para habilitar Google.');
      return;
    }

    const handleLoad = () => {
      setScriptLoaded(true);
      initialize();
    };

    const existingScript = document.getElementById('google-client-script');
    if (existingScript) {
      existingScript.addEventListener('load', handleLoad);
      if (window.google) {
        handleLoad();
      }
      return () => existingScript.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.id = 'google-client-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = handleLoad;
    script.onerror = () => setError('No pudimos cargar Google. Revisa tu conexión.');
    document.body.appendChild(script);

    return () => {
      script.removeEventListener('load', handleLoad);
    };
  }, []);

  const initialize = () => {
    if (!window.google || !CLIENT_ID) return;
    try {
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response: GoogleCredentialResponse) => {
          try {
            setError(null);
            const res = await fetch('/api/auth/google', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ credential: response.credential }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || 'No pudimos iniciar sesión con Google');
            }
            window.location.href = '/';
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Error con Google');
          }
        },
      });
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'filled_black',
          text: 'signin_with',
          size: 'large',
          locale: 'es-419',
        });
      }
    } catch (err) {
      const mensaje = err instanceof Error ? err.message : 'Google todavía no está listo. Recarga la página.';
      setError(mensaje);
    }
  };

  const handleManualClick = () => {
    if (window.google) {
      window.google.accounts.id.prompt();
    } else {
      setError('Google todavía se está cargando');
    }
  };

  if (!CLIENT_ID) {
    return <p className="text-sm text-red-400">Configura las variables de Google para habilitar este botón.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={buttonRef} className="flex justify-center" />
      {!scriptLoaded && (
        <motion.button
          type="button"
          onClick={handleManualClick}
          className="w-full py-2.5 bg-white/10 border border-gray-700 text-sm text-gray-100 rounded-lg hover:bg-white/20 transition-all"
          whileHover={{ scale: 1.02 }}
        >
          {texto}
        </motion.button>
      )}
      {error && <p className="text-sm text-red-400 text-center">{error}</p>}
    </div>
  );
}
