import type { Production, PendingActionType, PipelineStage } from '@/domain/types';
import type { PendingActionItem } from '@/domain/types/actions';
import { UI_COPY } from '@/config/uiCopy';
import { PENDING_ACTION_CONFIGS } from '@/domain/configs/pendingActions';

const URGENCY_ORDER: Record<PendingActionItem['urgency'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const actionStageFallback: Record<PendingActionType, PipelineStage> = {
  script: 'scripting',
  thumbnail: 'editing',
  seo: 'publishing',
  short: 'shorts',
  publish: 'publishing',
};

function createAction(
  production: Production,
  type: PendingActionType,
  urgency: PendingActionItem['urgency'],
  title: string
): PendingActionItem {
  const config = PENDING_ACTION_CONFIGS[type];
  const stage = config?.stage ?? actionStageFallback[type];

  return {
    id: `${production.id}-${type}`,
    type,
    title,
    productionTitle: production.title,
    productionId: production.id,
    urgency,
    stage,
    primaryCta: {
      label: config.primaryLabel,
      href: `/productions/${production.id}`,
    },
    secondaryCta: {
      label: config.secondaryLabel,
      href: config.secondaryHref,
    },
  };
}

export function buildPendingActions(productions: Production[]): PendingActionItem[] {
  const actions: PendingActionItem[] = [];

  for (const prod of productions) {
    if (prod.status === 'scripting' && (!prod.script_status || prod.script_status === 'draft')) {
      actions.push(createAction(prod, 'script', 'high', UI_COPY.pendingActionTitles.script));
    }
    if ((prod.status === 'editing' || prod.status === 'shorts') && (!prod.thumbnail_status || prod.thumbnail_status === 'pending')) {
      actions.push(createAction(prod, 'thumbnail', 'medium', UI_COPY.pendingActionTitles.thumbnail));
    }
    if ((prod.status === 'editing' || prod.status === 'publishing') && (!prod.seo_score || prod.seo_score < 60)) {
      actions.push(createAction(prod, 'seo', 'medium', UI_COPY.pendingActionTitles.seo));
    }
    if (prod.status === 'shorts' && prod.shorts_count === 0) {
      actions.push(createAction(prod, 'short', 'low', UI_COPY.pendingActionTitles.short));
    }
  }

  return actions
    .sort((a, b) => URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency])
    .slice(0, 5);
}
