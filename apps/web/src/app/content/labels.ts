export type ProductionStage = 'idea' | 'scripting' | 'recording' | 'editing' | 'shorts' | 'publishing' | 'published';
export type IdeaStatus = 'draft' | 'approved' | 'in_production' | 'completed' | 'archived';
export type AutomationRunStatus = 'running' | 'completed' | 'error';

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

export const IDEA_STATUS_LABELS: Record<IdeaStatus, string> = {
  draft: 'Borrador',
  approved: 'Aprobada',
  in_production: 'En Produccion',
  completed: 'Completada',
  archived: 'Archivada',
};

export const AUTOMATION_STATUS_LABELS: Record<AutomationRunStatus, string> = {
  running: 'En progreso',
  completed: 'Completado',
  error: 'Error',
};
