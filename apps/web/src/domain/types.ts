export const PIPELINE_STAGES = ['idea', 'scripting', 'recording', 'editing', 'shorts', 'publishing', 'published'] as const;
export type PipelineStage = typeof PIPELINE_STAGES[number];

export const PENDING_ACTION_TYPES = ['script', 'seo', 'thumbnail', 'short', 'publish'] as const;
export type PendingActionType = typeof PENDING_ACTION_TYPES[number];

export interface PipelineStats {
  idea: number;
  scripting: number;
  recording: number;
  editing: number;
  shorts: number;
  publishing: number;
  published: number;
}

export const PRODUCTION_STATUSES = ['idea', 'scripting', 'recording', 'editing', 'shorts', 'publishing', 'published'] as const;
export type ProductionStatus = typeof PRODUCTION_STATUSES[number];

export interface Production {
  id: string;
  title: string;
  description?: string | null;
  status: ProductionStatus;
  channel_name?: string;
  script_status?: string;
  thumbnail_status?: string;
  seo_score?: number;
  shorts_count: number;
  shorts_published: number;
  posts_count: number;
  posts_published: number;
  target_date?: string;
  scheduled_publish_at?: string | null;
  updated_at: string;
}

export interface PendingAction {
  id: string;
  type: PendingActionType;
  title: string;
  productionTitle: string;
  productionId: string;
  urgency: 'high' | 'medium' | 'low';
}

export const IDEA_STATUSES = ['draft', 'approved', 'in_production', 'completed', 'archived'] as const;
export type IdeaStatus = typeof IDEA_STATUSES[number];

export interface Idea {
  id: string;
  title: string;
  description: string | null;
  status: IdeaStatus;
  priority: number;
  tags: string[];
  channel_name: string | null;
  created_at: string;
}

export interface IdeaFormData {
  title: string;
  description: string;
  priority: number;
}

export interface IdeaUpdatePayload {
  title?: string;
  description?: string | null;
  status?: IdeaStatus;
  priority?: number;
}

export interface AutomationRun {
  id: string;
  workflow_name: string;
  workflow_id: string | null;
  execution_id: string | null;
  status: string;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}
