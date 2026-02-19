import type { PendingActionType, PipelineStage, ProductionStatus } from '@/domain/types';

export const STAGE_ROUTES: Record<PipelineStage, string> = {
  idea: '/ideas',
  scripting: '/scripts',
  recording: '/videos',
  editing: '/thumbnails',
  shorts: '/videos',
  publishing: '/seo',
  published: '/analytics',
};

export const ACTION_ROUTES: Record<PendingActionType, string> = {
  script: '/scripts',
  seo: '/seo',
  thumbnail: '/thumbnails',
  short: '/videos',
  publish: '/analytics',
};

export const STATUS_ROUTES: Record<ProductionStatus, string> = {
  idea: '/ideas',
  scripting: '/scripts',
  recording: '/videos',
  editing: '/thumbnails',
  shorts: '/videos',
  publishing: '/seo',
  published: '/analytics',
};

export const IDEA_FOCUS_ROUTE = (id: string): string => `/ideas?focus=${encodeURIComponent(id)}`;
