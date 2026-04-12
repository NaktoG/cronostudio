'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Clipboard, Eye, EyeOff, KeyRound, Link2, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import BackToDashboard from '../components/BackToDashboard';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';
import { PageTransition } from '../components/Animations';
import { useAuth, useAuthFetch } from '../contexts/AuthContext';
import { useLocale } from '../contexts/LocaleContext';
import { getSettingsCopy } from '../content/pages/settings';

interface Perfil {
  name: string;
  email: string;
}

interface Collaborator {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  accepted_at: string | null;
}

interface OAuthSettings {
  provider: string;
  configured: boolean;
  source: 'user' | 'env';
  clientId: string;
  redirectUri: string;
  scopes: string[];
  hasSecret: boolean;
}

export default function ConfiguracionPage() {
  const { logout, user } = useAuth();
  const { locale } = useLocale();
  const settingsCopy = getSettingsCopy(locale);
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
  const [showPasswordActual, setShowPasswordActual] = useState(false);
  const [showPasswordNueva, setShowPasswordNueva] = useState(false);
  const [showPasswordConfirmacion, setShowPasswordConfirmacion] = useState(false);
  const [textoConfirmacion, setTextoConfirmacion] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [oauthSettings, setOauthSettings] = useState<OAuthSettings | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthTesting, setOauthTesting] = useState(false);
  const [oauthMessage, setOauthMessage] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthForm, setOauthForm] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    scopes: '',
  });
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [recommendedRedirect, setRecommendedRedirect] = useState('');
  const lastRecommendedRef = useRef<string>('');
  const oauthTimerRef = useRef<number | null>(null);
  const oauthWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    const cargar = async () => {
      try {
        const response = await authFetch('/api/auth/profile');
        if (!response.ok) throw new Error(settingsCopy.profile.loadError);
        const data = await response.json();
        setPerfil({ name: data.user.name, email: data.user.email });
      } catch (error) {
        console.error('[settings] profile load failed', error);
        setErrorGeneral(settingsCopy.profile.loadErrorFallback);
      } finally {
        setCargandoPerfil(false);
      }
    };
    cargar();
  }, [authFetch, settingsCopy.profile.loadError, settingsCopy.profile.loadErrorFallback]);

  useEffect(() => {
    if (user?.role !== 'owner') return;
    const fetchTeam = async () => {
      try {
        const [collabRes, invitesRes] = await Promise.all([
          authFetch('/api/collaborators'),
          authFetch('/api/collaborators/invites'),
        ]);
        if (collabRes.ok) {
          const data = await collabRes.json();
          setCollaborators(data.collaborators ?? []);
        }
        if (invitesRes.ok) {
          const data = await invitesRes.json();
          setInvites(data.invites ?? []);
        }
      } catch (error) {
        console.error('[settings] team load failed', error);
      }
    };
    fetchTeam();
  }, [authFetch, user?.role, settingsCopy.oauth.loadError, settingsCopy.oauth.loadErrorFallback]);

  useEffect(() => {
    return () => {
      if (oauthTimerRef.current) {
        window.clearInterval(oauthTimerRef.current);
        oauthTimerRef.current = null;
      }
      if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
        oauthWindowRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const value = `${window.location.origin}/api/google/oauth/callback`;
    setRecommendedRedirect(value);
    setOauthForm((prev) => {
      if (!prev.redirectUri || prev.redirectUri === lastRecommendedRef.current) {
        return { ...prev, redirectUri: value };
      }
      return prev;
    });
    lastRecommendedRef.current = value;
  }, []);

  useEffect(() => {
    if (user?.role !== 'owner') return;
    const loadOAuthSettings = async () => {
      setOauthLoading(true);
      setOauthError(null);
      try {
        const response = await authFetch('/api/oauth/settings?provider=youtube');
        if (!response.ok) throw new Error(settingsCopy.oauth.loadError);
        const data = (await response.json()) as OAuthSettings;
        setOauthSettings(data);
        setOauthForm({
          clientId: data.clientId ?? '',
          clientSecret: '',
          redirectUri: data.redirectUri ?? '',
          scopes: (data.scopes ?? []).join(' '),
        });
      } catch (error) {
        setOauthError(error instanceof Error ? error.message : settingsCopy.oauth.loadErrorFallback);
      } finally {
        setOauthLoading(false);
      }
    };

    loadOAuthSettings();
  }, [authFetch, user?.role, settingsCopy.oauth.loadError, settingsCopy.oauth.loadErrorFallback]);

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
        throw new Error(data.error || settingsCopy.profile.saveError);
      }
      setMensajePerfil(settingsCopy.profile.saved);
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : settingsCopy.profile.saveErrorFallback);
    }
  };

  const cambiarPassword = async () => {
    setMensajePassword(null);
    setErrorGeneral(null);
    if (passwordNueva !== passwordConfirmacion) {
      setErrorGeneral(settingsCopy.security.mismatch);
      return;
    }
    try {
      const respuesta = await authFetch('/api/auth/password', {
        method: 'POST',
        body: JSON.stringify({ passwordActual, passwordNueva }),
      });
      const data = await respuesta.json();
      if (!respuesta.ok) {
        throw new Error(data.error || settingsCopy.security.updateError);
      }
      setMensajePassword(settingsCopy.security.updated);
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmacion('');
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : settingsCopy.security.updateError);
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
        throw new Error(data.error || settingsCopy.recovery.sendError);
      }
      setMensajeRecuperacion(settingsCopy.recovery.sent);
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : settingsCopy.recovery.sendErrorFallback);
    }
  };

  const crearInvitacion = async () => {
    setInviteError(null);
    setInviteMessage(null);
    setInviteLink('');
    if (!inviteEmail.trim()) {
      setInviteError(settingsCopy.team.invalidEmail);
      return;
    }
    setInviteLoading(true);
    try {
      const response = await authFetch('/api/collaborators/invites', {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim(), role: 'collaborator' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || settingsCopy.team.createError);
      }
      setInviteLink(data.inviteUrl);
      setInviteEmail('');
      setInviteMessage(settingsCopy.team.created);
      const invitesRes = await authFetch('/api/collaborators/invites');
      if (invitesRes.ok) {
        const invitesData = await invitesRes.json();
        setInvites(invitesData.invites ?? []);
      }
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : settingsCopy.team.createError);
    } finally {
      setInviteLoading(false);
    }
  };

  const copiarInvite = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setInviteMessage(settingsCopy.team.linkCopied);
    } catch {
      setInviteError(settingsCopy.team.linkCopyError);
    }
  };

  const copiarRedirectRecomendado = async () => {
    if (!recommendedRedirect) return;
    try {
      await navigator.clipboard.writeText(recommendedRedirect);
      setOauthMessage(settingsCopy.oauth.copyRedirectSuccess);
    } catch {
      setOauthError(settingsCopy.oauth.copyRedirectError);
    }
  };

  const guardarOAuth = async () => {
    setOauthError(null);
    setOauthMessage(null);
    setOauthLoading(true);
    try {
      const payload: Record<string, unknown> = {
        clientId: oauthForm.clientId.trim(),
        redirectUri: oauthForm.redirectUri.trim(),
        scopes: oauthForm.scopes.trim(),
      };
      if (oauthForm.clientSecret.trim()) {
        payload.clientSecret = oauthForm.clientSecret.trim();
      }

      const response = await authFetch('/api/oauth/settings?provider=youtube', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || settingsCopy.oauth.saveError);
      }
      setOauthSettings(data);
      setOauthForm((current) => ({ ...current, clientSecret: '' }));
      setOauthMessage(settingsCopy.oauth.saveSuccess);
    } catch (error) {
      setOauthError(error instanceof Error ? error.message : settingsCopy.oauth.saveError);
    } finally {
      setOauthLoading(false);
    }
  };

  const guardarYProbarOAuth = async () => {
    await guardarOAuth();
    await probarOAuth();
  };

  const eliminarOAuth = async () => {
    setOauthError(null);
    setOauthMessage(null);
    setOauthLoading(true);
    try {
      const response = await authFetch('/api/oauth/settings?provider=youtube', { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || settingsCopy.oauth.deleteError);
      }
      const refreshed = await authFetch('/api/oauth/settings?provider=youtube');
      if (refreshed.ok) {
        const data = (await refreshed.json()) as OAuthSettings;
        setOauthSettings(data);
        setOauthForm({
          clientId: data.clientId ?? '',
          clientSecret: '',
          redirectUri: data.redirectUri ?? '',
          scopes: (data.scopes ?? []).join(' '),
        });
      }
      setOauthMessage(settingsCopy.oauth.deleteSuccess);
    } catch (error) {
      setOauthError(error instanceof Error ? error.message : settingsCopy.oauth.deleteError);
    } finally {
      setOauthLoading(false);
    }
  };

  const probarOAuth = async () => {
    if (oauthTesting) return;
    setOauthTesting(true);
    setOauthError(null);
    setOauthMessage(null);

    const params = new URLSearchParams({
      prompt: 'select_account consent',
    });
    if (user?.email) {
      params.set('login_hint', user.email);
    }

    const connectUrl = `/api/google/oauth/start?${params.toString()}`;
    const popup = window.open(connectUrl, 'youtube-oauth-test', 'width=520,height=700');
    if (!popup) {
      setOauthTesting(false);
      setOauthError(settingsCopy.oauth.popupError);
      return;
    }
    oauthWindowRef.current = popup;

    const stopTesting = () => {
      if (oauthTimerRef.current) {
        window.clearInterval(oauthTimerRef.current);
        oauthTimerRef.current = null;
      }
      if (oauthWindowRef.current && !oauthWindowRef.current.closed) {
        oauthWindowRef.current.close();
      }
      oauthWindowRef.current = null;
      setOauthTesting(false);
    };

    oauthTimerRef.current = window.setInterval(async () => {
      if (oauthWindowRef.current?.closed) {
        stopTesting();
        return;
      }
      try {
        const statusRes = await authFetch('/api/integrations/youtube/status');
        if (!statusRes.ok) return;
        const data = await statusRes.json();
        if (data?.connected) {
          stopTesting();
          setOauthMessage(settingsCopy.oauth.connectSuccess);
        }
      } catch {
        // ignore transient errors
      }
    }, 1500);

    window.setTimeout(() => {
      if (oauthTesting) {
        stopTesting();
        setOauthError(settingsCopy.oauth.connectTimeout);
      }
    }, 120000);
  };

  const eliminarCuenta = async () => {
    if (textoConfirmacion.trim().toUpperCase() !== 'ELIMINAR') {
      setErrorGeneral(settingsCopy.danger.confirmError);
      return;
    }
    setEliminando(true);
    setErrorGeneral(null);
    try {
      const respuesta = await authFetch('/api/auth/profile', { method: 'DELETE' });
      const data = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        throw new Error(data.error || settingsCopy.danger.deleteError);
      }
      logout();
      router.replace('/login');
    } catch (error) {
      setErrorGeneral(error instanceof Error ? error.message : settingsCopy.danger.deleteError);
    } finally {
      setEliminando(false);
    }
  };

  const contenido = (
    <div className="space-y-6">
      <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">{settingsCopy.profile.section}</h2>
        <p className="text-sm text-gray-400 mb-6">{settingsCopy.profile.helper}</p>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm text-gray-400">{settingsCopy.profile.name}</label>
            <input
              type="text"
              value={perfil.name}
              onChange={(e) => setPerfil((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full mt-1 rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-400">{settingsCopy.profile.email}</label>
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
          {settingsCopy.profile.save}
        </motion.button>
        {mensajePerfil && <p className="text-sm text-green-400 mt-3">{mensajePerfil}</p>}
      </section>

      <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">{settingsCopy.security.section}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-gray-400">{settingsCopy.security.currentPassword}</label>
            <div className="relative mt-1">
              <input
                type={showPasswordActual ? 'text' : 'password'}
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                className="w-full rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 pr-10 text-white focus:border-yellow-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPasswordActual((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-300 transition-colors"
                aria-label={showPasswordActual ? settingsCopy.security.hideCurrent : settingsCopy.security.showCurrent}
              >
                {showPasswordActual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400">{settingsCopy.security.newPassword}</label>
            <div className="relative mt-1">
              <input
                type={showPasswordNueva ? 'text' : 'password'}
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                className="w-full rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 pr-10 text-white focus:border-yellow-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPasswordNueva((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-300 transition-colors"
                aria-label={showPasswordNueva ? settingsCopy.security.hideNew : settingsCopy.security.showNew}
              >
                {showPasswordNueva ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-400">{settingsCopy.security.confirmNew}</label>
            <div className="relative mt-1">
              <input
                type={showPasswordConfirmacion ? 'text' : 'password'}
                value={passwordConfirmacion}
                onChange={(e) => setPasswordConfirmacion(e.target.value)}
                className="w-full rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 pr-10 text-white focus:border-yellow-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmacion((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-300 transition-colors"
                aria-label={showPasswordConfirmacion ? settingsCopy.security.hideConfirm : settingsCopy.security.showConfirm}
              >
                {showPasswordConfirmacion ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        <motion.button
          onClick={cambiarPassword}
          className="mt-4 px-5 py-2.5 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300"
          whileHover={{ scale: 1.02 }}
        >
          {settingsCopy.security.updatePassword}
        </motion.button>
        {mensajePassword && <p className="text-sm text-green-400 mt-3">{mensajePassword}</p>}
      </section>

      {user?.role === 'owner' && (
        <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-white mb-4">
            <KeyRound className="h-5 w-5 text-yellow-300" />
            <h2 className="text-xl font-semibold">{settingsCopy.oauth.section}</h2>
          </div>
          <p className="text-sm text-gray-400 mb-2">
            {settingsCopy.oauth.helper}
          </p>
          {oauthSettings && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <span className="rounded-full border border-gray-800 px-3 py-1">
                {settingsCopy.oauth.source} {oauthSettings.source === 'user' ? settingsCopy.oauth.sourceUser : settingsCopy.oauth.sourceEnv}
              </span>
              <span className={`rounded-full border px-3 py-1 ${oauthSettings.configured ? 'border-green-500/40 text-green-400' : 'border-yellow-500/40 text-yellow-300'}`}>
                {oauthSettings.configured ? settingsCopy.oauth.configured : settingsCopy.oauth.notConfigured}
              </span>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-gray-400">Client ID</label>
              <input
                type="text"
                value={oauthForm.clientId}
                onChange={(e) => setOauthForm((prev) => ({ ...prev, clientId: e.target.value }))}
                className="w-full mt-1 rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Redirect URI</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={oauthForm.redirectUri}
                  onChange={(e) => setOauthForm((prev) => ({ ...prev, redirectUri: e.target.value }))}
                  className="w-full rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 pr-10 text-white focus:border-yellow-400 focus:outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  <Link2 className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>{settingsCopy.oauth.recommended} {recommendedRedirect || '...'}</span>
                <button
                  type="button"
                  onClick={copiarRedirectRecomendado}
                  className="inline-flex items-center gap-1 rounded-full border border-gray-800 px-2 py-1 text-[11px] text-slate-300 hover:border-yellow-400/50"
                >
                  <Clipboard className="h-3 w-3" />
                  {settingsCopy.oauth.copy}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-400">Client Secret</label>
              <div className="relative mt-1">
                <input
                  type={showClientSecret ? 'text' : 'password'}
                  value={oauthForm.clientSecret}
                  onChange={(e) => setOauthForm((prev) => ({ ...prev, clientSecret: e.target.value }))}
                  placeholder={oauthSettings?.hasSecret ? settingsCopy.oauth.secretPlaceholderSaved : settingsCopy.oauth.secretPlaceholderEmpty}
                  className="w-full rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 pr-10 text-white focus:border-yellow-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowClientSecret((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-300 transition-colors"
                  aria-label={showClientSecret ? settingsCopy.security.hideNew : settingsCopy.security.showNew}
                >
                  {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">{settingsCopy.oauth.keepSecretHint}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Scopes</label>
              <textarea
                value={oauthForm.scopes}
                onChange={(e) => setOauthForm((prev) => ({ ...prev, scopes: e.target.value }))}
                rows={3}
                className="w-full mt-1 rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
              />
              <p className="mt-2 text-xs text-slate-500">{settingsCopy.oauth.scopesHint}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <motion.button
              onClick={guardarOAuth}
              disabled={oauthLoading}
              className="px-5 py-2.5 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-60"
              whileHover={{ scale: 1.02 }}
            >
              {oauthLoading ? settingsCopy.oauth.saving : settingsCopy.oauth.save}
            </motion.button>
            <motion.button
              onClick={guardarYProbarOAuth}
              disabled={oauthLoading || oauthTesting}
              className="px-5 py-2.5 bg-gray-200 text-black font-semibold rounded-lg hover:bg-white disabled:opacity-60"
              whileHover={{ scale: 1.02 }}
            >
              {oauthLoading || oauthTesting ? settingsCopy.oauth.preparing : settingsCopy.oauth.saveAndTest}
            </motion.button>
            <button
              type="button"
              onClick={probarOAuth}
              disabled={oauthTesting}
              className="px-5 py-2.5 rounded-lg border border-gray-800 text-sm text-gray-300 hover:border-yellow-400/50 disabled:opacity-50"
            >
              {oauthTesting ? settingsCopy.oauth.testing : settingsCopy.oauth.test}
            </button>
            <button
              type="button"
              onClick={eliminarOAuth}
              disabled={oauthLoading || !oauthSettings?.configured}
              className="px-5 py-2.5 rounded-lg border border-gray-800 text-sm text-gray-300 hover:border-yellow-400/50 disabled:opacity-50"
            >
              {settingsCopy.oauth.resetServer}
            </button>
          </div>
          {oauthMessage && <p className="text-sm text-green-400 mt-3">{oauthMessage}</p>}
          {oauthError && <p className="text-sm text-red-400 mt-3">{oauthError}</p>}
        </section>
      )}

      {user?.role === 'owner' && (
        <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-white mb-4">
            <Users className="h-5 w-5 text-yellow-300" />
            <h2 className="text-xl font-semibold">{settingsCopy.team.section}</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">{settingsCopy.team.helper}</p>
          <p className="text-xs text-slate-500 mb-4">{settingsCopy.team.helper2}</p>

          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={settingsCopy.team.emailPlaceholder}
              className="w-full rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 text-white focus:border-yellow-400 focus:outline-none"
            />
            <motion.button
              onClick={crearInvitacion}
              disabled={inviteLoading}
              className="px-5 py-2.5 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 disabled:opacity-60"
              whileHover={{ scale: 1.02 }}
            >
              {inviteLoading ? settingsCopy.team.creating : settingsCopy.team.createInvite}
            </motion.button>
          </div>

          {inviteError && <p className="text-sm text-red-400 mt-3">{inviteError}</p>}
          {inviteMessage && <p className="text-sm text-green-400 mt-3">{inviteMessage}</p>}

          {inviteLink && (
            <div className="mt-4 rounded-lg border border-gray-800 bg-gray-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{settingsCopy.team.invitationLink}</p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 rounded-lg bg-gray-900/60 border border-gray-800 px-3 py-2 text-xs text-slate-200"
              />
              <button
                type="button"
                onClick={copiarInvite}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-800 px-3 py-2 text-xs text-slate-200 hover:border-yellow-500/40 sm:w-auto"
              >
                <Clipboard className="h-4 w-4" />
                {settingsCopy.oauth.copy}
              </button>
            </div>
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{settingsCopy.team.collaborators}</p>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                {collaborators.length === 0 && <p className="text-slate-500">{settingsCopy.team.noCollaborators}</p>}
                {collaborators.map((collab) => (
                  <div key={collab.id} className="flex min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate">{collab.name || collab.email}</span>
                    <span className="text-xs text-slate-500">{collab.role}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{settingsCopy.team.invites}</p>
              <div className="mt-3 space-y-2 text-sm text-slate-200">
                {invites.length === 0 && <p className="text-slate-500">{settingsCopy.team.noInvites}</p>}
                {invites.map((invite) => (
                  <div key={invite.id} className="flex min-w-0 items-center justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate">{invite.email}</span>
                    <span className="text-xs text-slate-500">{invite.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">{settingsCopy.recovery.section}</h2>
        <p className="text-sm text-gray-400 mb-4">{settingsCopy.recovery.helper}</p>
        <motion.button
          onClick={enviarRecuperacion}
          className="px-5 py-2.5 bg-gray-200 text-black font-semibold rounded-lg hover:bg-white"
          whileHover={{ scale: 1.02 }}
        >
          {settingsCopy.recovery.send}
        </motion.button>
        {mensajeRecuperacion && <p className="text-sm text-green-400 mt-3">{mensajeRecuperacion}</p>}
      </section>

      <section className="bg-red-950/40 border border-red-900 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-white mb-4">{settingsCopy.danger.section}</h2>
        <p className="text-sm text-red-300 mb-4">{settingsCopy.danger.helper}</p>
        <label className="text-sm text-gray-400">{settingsCopy.danger.confirmLabel}</label>
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
          {eliminando ? settingsCopy.danger.deleting : settingsCopy.danger.delete}
        </motion.button>
      </section>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Header />
        <PageTransition className="flex-1">
          <main className="w-full px-4 sm:px-6 lg:px-12 py-6 sm:py-8">
            <motion.div className="mb-8 space-y-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <BackToDashboard />
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">{settingsCopy.title}</h1>
                <p className="text-sm sm:text-base text-gray-400">{settingsCopy.subtitle}</p>
                {user && <p className="text-sm text-gray-500 mt-1">{settingsCopy.signedInAs} {user.email}</p>}
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
