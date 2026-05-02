import { SEO_SCORE_MIN_READY } from '@/app/content/status/productions';
import type { Production } from '@/app/components/ProductionsList';
import type { getDashboardCopy } from '@/app/content/dashboard';
import type { PriorityAction } from '@/app/content/dashboardTypes';

export function generatePriorityActions(
  productions: Production[],
  dashboardCopy: ReturnType<typeof getDashboardCopy>
): PriorityAction[] {
  const actions: PriorityAction[] = [];
  for (const prod of productions) {
    if (prod.status === 'scripting' && (!prod.script_status || prod.script_status === 'draft')) {
      actions.push({ id: prod.id, type: 'script', title: dashboardCopy.priorityActions.script, productionTitle: prod.title, productionId: prod.id, urgency: 'high' });
    }
    if ((prod.status === 'editing' || prod.status === 'shorts') && (!prod.thumbnail_status || prod.thumbnail_status === 'pending')) {
      actions.push({ id: `${prod.id}-thumb`, type: 'thumbnail', title: dashboardCopy.priorityActions.thumbnail, productionTitle: prod.title, productionId: prod.id, urgency: 'medium' });
    }
    if ((prod.status === 'editing' || prod.status === 'publishing') && (!prod.seo_score || prod.seo_score < SEO_SCORE_MIN_READY)) {
      actions.push({ id: `${prod.id}-seo`, type: 'seo', title: dashboardCopy.priorityActions.seo, productionTitle: prod.title, productionId: prod.id, urgency: 'medium' });
    }
    if (prod.status === 'shorts' && prod.shorts_count === 0) {
      actions.push({ id: `${prod.id}-short`, type: 'short', title: dashboardCopy.priorityActions.shorts, productionTitle: prod.title, productionId: prod.id, urgency: 'low' });
    }
  }

  const urgencyOrder = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]).slice(0, 5);
}

export function getChecklistStatus(production: Production) {
  const scriptReady = production.script_status && production.script_status !== 'draft';
  const seoReady = typeof production.seo_score === 'number' && production.seo_score >= SEO_SCORE_MIN_READY;
  const thumbnailReady = production.thumbnail_status === 'approved';
  const published = production.status === 'published';

  return {
    scriptReady,
    seoReady,
    thumbnailReady,
    published,
  };
}
