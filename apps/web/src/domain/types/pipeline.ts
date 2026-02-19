import type { LucideIcon } from 'lucide-react';
import type { PipelineStage } from '@/domain/types';

export type PipelineStageId = PipelineStage;

export interface PipelineStageConfig {
  id: PipelineStageId;
  label: string;
  icon: LucideIcon;
  route: string;
  queryKey: string;
}
