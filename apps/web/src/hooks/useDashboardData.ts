import { useCallback, useState } from 'react';
import type { AutomationRun, Idea, PipelineStats, Production } from '@/domain/types';
import { productionsService } from '@/services/productionsService';
import { automationRunsService } from '@/services/automationRunsService';
import type { AuthFetch } from '@/services/types';
import { ideasService } from '@/services/ideasService';

export type DashboardData = {
  productions: Production[];
  pipelineStats: PipelineStats;
  ideasCount: number;
  ideas: Idea[];
  runs: AutomationRun[];
};

const EMPTY_PIPELINE: PipelineStats = {
  idea: 0,
  scripting: 0,
  recording: 0,
  editing: 0,
  shorts: 0,
  publishing: 0,
  published: 0,
};

export function useDashboardData(authFetch: AuthFetch, isAuthenticated: boolean) {
  const [data, setData] = useState<DashboardData>({
    productions: [],
    pipelineStats: EMPTY_PIPELINE,
    ideasCount: 0,
    ideas: [],
    runs: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setData({ productions: [], pipelineStats: EMPTY_PIPELINE, ideasCount: 0, ideas: [], runs: [] });
      setLoading(false);
      return;
    }

    try {
      const [productionsRes, ideasRes, runsRes] = await Promise.all([
        productionsService.list(authFetch, true),
        ideasService.list(authFetch),
        automationRunsService.list(authFetch),
      ]);

      const ideasData = Array.isArray(ideasRes) ? ideasRes : [];
      const ideaCount = ideasData.length;
      const pipelineStats = productionsRes.pipeline || EMPTY_PIPELINE;
      const pipelineWithIdeas = {
        ...pipelineStats,
        idea: ideaCount,
      };
      setData({
        productions: productionsRes.productions || [],
        pipelineStats: pipelineWithIdeas,
        ideasCount: ideaCount,
        ideas: ideasData,
        runs: Array.isArray(runsRes) ? runsRes : [],
      });
    } catch {
      setData({ productions: [], pipelineStats: EMPTY_PIPELINE, ideasCount: 0, ideas: [], runs: [] });
    } finally {
      setLoading(false);
    }
  }, [authFetch, isAuthenticated]);

  return { data, loading, fetchData };
}
