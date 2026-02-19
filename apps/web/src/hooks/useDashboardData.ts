import { useCallback, useState } from 'react';
import type { AutomationRun, PipelineStats, Production } from '@/domain/types';
import { productionsService } from '@/services/productionsService';
import { automationRunsService } from '@/services/automationRunsService';
import type { AuthFetch } from '@/services/types';

export type DashboardData = {
  productions: Production[];
  pipelineStats: PipelineStats;
  ideasCount: number;
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
    runs: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) {
      setData({ productions: [], pipelineStats: EMPTY_PIPELINE, ideasCount: 0, runs: [] });
      setLoading(false);
      return;
    }

    try {
      const [productionsRes, ideasRes, runsRes] = await Promise.all([
        productionsService.list(authFetch, true),
        authFetch('/api/ideas'),
        automationRunsService.list(authFetch),
      ]);

      const ideasData = ideasRes.ok ? await ideasRes.json() : [];
      setData({
        productions: productionsRes.productions || [],
        pipelineStats: productionsRes.pipeline || EMPTY_PIPELINE,
        ideasCount: Array.isArray(ideasData) ? ideasData.length : 0,
        runs: Array.isArray(runsRes) ? runsRes : [],
      });
    } catch {
      setData({ productions: [], pipelineStats: EMPTY_PIPELINE, ideasCount: 0, runs: [] });
    } finally {
      setLoading(false);
    }
  }, [authFetch, isAuthenticated]);

  return { data, loading, fetchData };
}
