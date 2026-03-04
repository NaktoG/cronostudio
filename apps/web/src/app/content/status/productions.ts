import { SEO_SCORE_THRESHOLDS } from '@/app/content/status/seo';

export type ProductionStage = 'idea' | 'scripting' | 'recording' | 'editing' | 'shorts' | 'publishing' | 'published';

export const PRODUCTION_STAGE_LABELS: Record<ProductionStage, string> = {
  idea: 'Idea',
  scripting: 'Guion',
  recording: 'Grabacion',
  editing: 'Edicion',
  shorts: 'Shorts',
  publishing: 'Publicar',
  published: 'Publicado',
};

export const PRODUCTION_STATUS_BADGES: Record<ProductionStage, string> = {
  idea: 'Idea',
  scripting: 'Guion',
  recording: 'Grabando',
  editing: 'Editando',
  shorts: 'Shorts',
  publishing: 'Publicando',
  published: 'Publicado',
};

export const NEXT_ACTION_LABELS: Record<ProductionStage, string> = {
  idea: 'Empezar guion',
  scripting: 'Continuar guion',
  recording: 'Subir grabacion',
  editing: 'Terminar edicion',
  shorts: 'Crear shorts',
  publishing: 'Programar publicacion',
  published: 'Ver detalles',
};

export const PIPELINE_STAGE_LABELS: Record<ProductionStage, string> = {
  idea: 'Ideas',
  scripting: 'Guiones',
  recording: 'Grabacion',
  editing: 'Edicion',
  shorts: 'Shorts',
  publishing: 'Publicacion',
  published: 'Publicado',
};

export const PRODUCTION_STAGE_STYLES: Record<ProductionStage, { badge: string; icon: string }> = {
  idea: { badge: 'bg-gray-800 text-slate-200 border border-gray-700', icon: '💡' },
  scripting: { badge: 'bg-yellow-400/10 text-yellow-200 border border-yellow-400/20', icon: '✍️' },
  recording: { badge: 'bg-amber-400/10 text-amber-200 border border-amber-400/20', icon: '🎙️' },
  editing: { badge: 'bg-blue-400/10 text-blue-200 border border-blue-400/20', icon: '🎬' },
  shorts: { badge: 'bg-purple-400/10 text-purple-200 border border-purple-400/20', icon: '⚡' },
  publishing: { badge: 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20', icon: '🚀' },
  published: { badge: 'bg-emerald-400/10 text-emerald-200 border border-emerald-400/20', icon: '✅' },
};

export const SEO_SCORE_MIN_READY = SEO_SCORE_THRESHOLDS.good;
