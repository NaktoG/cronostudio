import type { PendingActionType, PipelineStage } from '@/domain/types';
import { UI_COPY } from '@/config/uiCopy';
import { PIPELINE_STAGE_CONFIG_BY_ID } from '@/domain/configs/pipeline';
import { ACTION_ROUTES } from '@/config/routes';

export interface PendingActionConfig {
  type: PendingActionType;
  stage: PipelineStage;
  primaryLabel: string;
  secondaryLabel: string;
  secondaryHref: string;
}

export const PENDING_ACTION_CONFIGS: Record<PendingActionType, PendingActionConfig> = {
  script: {
    type: 'script',
    stage: 'scripting',
    primaryLabel: UI_COPY.pendingActions.primaryLabels.script,
    secondaryLabel: UI_COPY.pendingActions.secondaryLabels.pipeline,
    secondaryHref: PIPELINE_STAGE_CONFIG_BY_ID.scripting.route,
  },
  seo: {
    type: 'seo',
    stage: 'publishing',
    primaryLabel: UI_COPY.pendingActions.primaryLabels.seo,
    secondaryLabel: UI_COPY.pendingActions.secondaryLabels.pipeline,
    secondaryHref: PIPELINE_STAGE_CONFIG_BY_ID.publishing.route,
  },
  thumbnail: {
    type: 'thumbnail',
    stage: 'editing',
    primaryLabel: UI_COPY.pendingActions.primaryLabels.thumbnail,
    secondaryLabel: UI_COPY.pendingActions.secondaryLabels.section,
    secondaryHref: ACTION_ROUTES.thumbnail,
  },
  short: {
    type: 'short',
    stage: 'shorts',
    primaryLabel: UI_COPY.pendingActions.primaryLabels.short,
    secondaryLabel: UI_COPY.pendingActions.secondaryLabels.section,
    secondaryHref: ACTION_ROUTES.short,
  },
  publish: {
    type: 'publish',
    stage: 'publishing',
    primaryLabel: UI_COPY.pendingActions.primaryLabels.publish,
    secondaryLabel: UI_COPY.pendingActions.secondaryLabels.pipeline,
    secondaryHref: PIPELINE_STAGE_CONFIG_BY_ID.publishing.route,
  },
};
