import type { Locale } from '@/app/i18n/messages';

type AuthStep = { title: string; text: string };

type AuthLocaleCopy = {
  marketingBadge: string;
  marketingCards: Array<{ title: string; text: string }>;
  marketingFlowTitle: string;
  marketingSteps: AuthStep[];
  login: {
    title: string;
    subtitle: string;
    heroTitle: string;
    heroDescription: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    submitIdle: string;
    submitLoading: string;
    forgotPassword: string;
    resendVerification: string;
    noAccount: string;
    noAccountCta: string;
    validationRequired: string;
  };
  register: {
    title: string;
    subtitle: string;
    heroTitle: string;
    heroDescription: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    passwordHint: string;
    showPassword: string;
    hidePassword: string;
    submitIdle: string;
    submitLoading: string;
    verifyInfo: string;
    existingAccount: string;
    existingAccountCta: string;
    successFallback: string;
    verificationLinkLabel: string;
    resendVerificationPrefix: string;
    resendVerificationCta: string;
    validationRequired: string;
    validationPasswordMismatch: string;
    validationPasswordLength: string;
    validationPasswordUpper: string;
    validationPasswordNumber: string;
  };
  forgotPassword: {
    title: string;
    subtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    submitIdle: string;
    submitLoading: string;
    backToLogin: string;
    manualLinkLabel: string;
    validationRequired: string;
    requestFailed: string;
    successFallback: string;
    unknownError: string;
  };
  resetPassword: {
    title: string;
    subtitle: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    confirmPasswordLabel: string;
    confirmPasswordPlaceholder: string;
    passwordHint: string;
    showPassword: string;
    hidePassword: string;
    submitIdle: string;
    submitLoading: string;
    backToLogin: string;
    invalidToken: string;
    requiredFields: string;
    passwordMismatch: string;
    requestFailed: string;
    successMessage: string;
    unknownError: string;
  };
};

const AUTH_COPY: Record<Locale, AuthLocaleCopy> = {
  es: {
    marketingBadge: 'Estudio creativo',
    marketingCards: [
      { title: 'Para que sirve', text: 'Disenar un pipeline claro para publicar con consistencia y sin perder el control.' },
      { title: 'Resultados visibles', text: 'Seguimiento semanal de metas y alertas para corregir el rumbo a tiempo.' },
    ],
    marketingFlowTitle: 'Como funciona',
    marketingSteps: [
      { title: 'Conecta', text: 'Autoriza YouTube y define tu canal.' },
      { title: 'Planifica', text: 'Idea, guion, SEO y miniatura con flujo claro.' },
      { title: 'Automatiza', text: 'Sincroniza videos y analytics sin tocar APIs.' },
    ],
    login: {
      title: 'CronoStudio',
      subtitle: 'Inicia sesion en tu cuenta',
      heroTitle: 'CronoStudio convierte tu canal en un sistema de produccion',
      heroDescription: 'Centraliza ideas, guiones, miniaturas y SEO con automatizaciones que reducen friccion y te devuelven tiempo creativo.',
      emailLabel: 'Email',
      emailPlaceholder: 'tu@email.com',
      passwordLabel: 'Contrasena',
      passwordPlaceholder: '••••••••',
      showPassword: 'Mostrar contrasena',
      hidePassword: 'Ocultar contrasena',
      submitIdle: 'Iniciar sesion',
      submitLoading: 'Iniciando sesion...',
      forgotPassword: 'Olvidaste tu contrasena?',
      resendVerification: 'Reenviar verificacion de email',
      noAccount: 'No tienes cuenta?',
      noAccountCta: 'Registrate',
      validationRequired: 'Por favor completa todos los campos',
    },
    register: {
      title: 'CronoStudio',
      subtitle: 'Crea tu cuenta',
      heroTitle: 'Tu canal en un sistema de produccion constante',
      heroDescription: 'CronoStudio ordena el caos creativo para que publiques con ritmo, claridad y foco en calidad.',
      nameLabel: 'Nombre',
      namePlaceholder: 'Tu nombre',
      emailLabel: 'Email',
      emailPlaceholder: 'tu@email.com',
      passwordLabel: 'Contrasena',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirmar contrasena',
      confirmPasswordPlaceholder: '••••••••',
      passwordHint: 'Minimo 8 caracteres, una mayuscula y un numero',
      showPassword: 'Mostrar contrasena',
      hidePassword: 'Ocultar contrasena',
      submitIdle: 'Crear cuenta',
      submitLoading: 'Creando cuenta...',
      verifyInfo: 'Te enviaremos un email para verificar tu cuenta',
      existingAccount: 'Ya tienes cuenta?',
      existingAccountCta: 'Inicia sesion',
      successFallback: 'Cuenta creada. Revisa tu email para verificarla.',
      verificationLinkLabel: 'Link de verificacion',
      resendVerificationPrefix: 'Si no te llega el email, podes',
      resendVerificationCta: 'reenviar la verificacion',
      validationRequired: 'Por favor completa todos los campos',
      validationPasswordMismatch: 'Las contrasenas no coinciden',
      validationPasswordLength: 'La contrasena debe tener al menos 8 caracteres',
      validationPasswordUpper: 'La contrasena debe contener al menos una mayuscula',
      validationPasswordNumber: 'La contrasena debe contener al menos un numero',
    },
    forgotPassword: {
      title: 'Recuperar acceso',
      subtitle: 'Te enviaremos un link para restablecer tu contrasena',
      emailLabel: 'Email',
      emailPlaceholder: 'tu@email.com',
      submitIdle: 'Enviar link',
      submitLoading: 'Enviando...',
      backToLogin: 'Volver a iniciar sesion',
      manualLinkLabel: 'Link manual',
      validationRequired: 'Ingresa tu email',
      requestFailed: 'Error al solicitar reset',
      successFallback: 'Si el email existe, se envio un link',
      unknownError: 'Error desconocido',
    },
    resetPassword: {
      title: 'Restablecer contrasena',
      subtitle: 'Elige una nueva contrasena',
      passwordLabel: 'Nueva contrasena',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirmar contrasena',
      confirmPasswordPlaceholder: '••••••••',
      passwordHint: 'Minimo 8 caracteres, una mayuscula y un numero',
      showPassword: 'Mostrar contrasena',
      hidePassword: 'Ocultar contrasena',
      submitIdle: 'Actualizar contrasena',
      submitLoading: 'Actualizando...',
      backToLogin: 'Volver a iniciar sesion',
      invalidToken: 'Token invalido',
      requiredFields: 'Completa todos los campos',
      passwordMismatch: 'Las contrasenas no coinciden',
      requestFailed: 'Error al restablecer',
      successMessage: 'Contrasena actualizada. Ya puedes iniciar sesion.',
      unknownError: 'Error desconocido',
    },
  },
  en: {
    marketingBadge: 'Creative studio',
    marketingCards: [
      { title: 'What it is for', text: 'Design a clear pipeline to publish consistently without losing control.' },
      { title: 'Visible results', text: 'Weekly goal tracking and alerts to correct course on time.' },
    ],
    marketingFlowTitle: 'How it works',
    marketingSteps: [
      { title: 'Connect', text: 'Authorize YouTube and define your channel.' },
      { title: 'Plan', text: 'Ideas, script, SEO, and thumbnail with a clear flow.' },
      { title: 'Automate', text: 'Sync videos and analytics without touching APIs.' },
    ],
    login: {
      title: 'CronoStudio',
      subtitle: 'Sign in to your account',
      heroTitle: 'CronoStudio turns your channel into a production system',
      heroDescription: 'Centralize ideas, scripts, thumbnails, and SEO with automations that reduce friction and return creative time.',
      emailLabel: 'Email',
      emailPlaceholder: 'you@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      submitIdle: 'Sign in',
      submitLoading: 'Signing in...',
      forgotPassword: 'Forgot your password?',
      resendVerification: 'Resend verification email',
      noAccount: 'Do not have an account?',
      noAccountCta: 'Sign up',
      validationRequired: 'Please complete all fields',
    },
    register: {
      title: 'CronoStudio',
      subtitle: 'Create your account',
      heroTitle: 'Your channel as a consistent production system',
      heroDescription: 'CronoStudio organizes creative chaos so you publish with rhythm, clarity, and quality focus.',
      nameLabel: 'Name',
      namePlaceholder: 'Your name',
      emailLabel: 'Email',
      emailPlaceholder: 'you@email.com',
      passwordLabel: 'Password',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirm password',
      confirmPasswordPlaceholder: '••••••••',
      passwordHint: 'Minimum 8 characters, one uppercase letter, and one number',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      submitIdle: 'Create account',
      submitLoading: 'Creating account...',
      verifyInfo: 'We will send you an email to verify your account',
      existingAccount: 'Already have an account?',
      existingAccountCta: 'Sign in',
      successFallback: 'Account created. Check your email to verify it.',
      verificationLinkLabel: 'Verification link',
      resendVerificationPrefix: 'If you do not receive the email, you can',
      resendVerificationCta: 'resend verification',
      validationRequired: 'Please complete all fields',
      validationPasswordMismatch: 'Passwords do not match',
      validationPasswordLength: 'Password must be at least 8 characters',
      validationPasswordUpper: 'Password must include at least one uppercase letter',
      validationPasswordNumber: 'Password must include at least one number',
    },
    forgotPassword: {
      title: 'Recover access',
      subtitle: 'We will send a link to reset your password',
      emailLabel: 'Email',
      emailPlaceholder: 'you@email.com',
      submitIdle: 'Send link',
      submitLoading: 'Sending...',
      backToLogin: 'Back to sign in',
      manualLinkLabel: 'Manual link',
      validationRequired: 'Enter your email',
      requestFailed: 'Failed to request reset',
      successFallback: 'If the email exists, a link was sent',
      unknownError: 'Unknown error',
    },
    resetPassword: {
      title: 'Reset password',
      subtitle: 'Choose a new password',
      passwordLabel: 'New password',
      passwordPlaceholder: '••••••••',
      confirmPasswordLabel: 'Confirm password',
      confirmPasswordPlaceholder: '••••••••',
      passwordHint: 'Minimum 8 characters, one uppercase letter, and one number',
      showPassword: 'Show password',
      hidePassword: 'Hide password',
      submitIdle: 'Update password',
      submitLoading: 'Updating...',
      backToLogin: 'Back to sign in',
      invalidToken: 'Invalid token',
      requiredFields: 'Complete all fields',
      passwordMismatch: 'Passwords do not match',
      requestFailed: 'Failed to reset password',
      successMessage: 'Password updated. You can sign in now.',
      unknownError: 'Unknown error',
    },
  },
};

export function getAuthCopy(locale: Locale): AuthLocaleCopy {
  return AUTH_COPY[locale] ?? AUTH_COPY.es;
}
