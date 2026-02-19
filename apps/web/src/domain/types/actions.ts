import type { PendingActionType, PipelineStage } from '@/domain/types';

export type PendingActionUrgency = 'high' | 'medium' | 'low';

export interface PendingActionCta {
  label: string;
  href: string;
}

export interface PendingActionItem {
  id: string;
  type: PendingActionType;
  title: string;
  productionTitle: string;
  productionId: string;
  urgency: PendingActionUrgency;
  stage: PipelineStage;
  primaryCta: PendingActionCta;
  secondaryCta: PendingActionCta;
}
