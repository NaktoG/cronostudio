import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { PipelineStage } from '@/domain/types';
import { PIPELINE_STAGE_CONFIG_BY_ID, PIPELINE_STAGE_QUERY_KEY } from '@/domain/configs/pipeline';

const isPipelineStage = (value: string | null): value is PipelineStage => {
  if (!value) return false;
  return value in PIPELINE_STAGE_CONFIG_BY_ID;
};

export function usePipelineFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageParam = searchParams?.get(PIPELINE_STAGE_QUERY_KEY) ?? null;

  const activeStage = useMemo<PipelineStage | null>(() => {
    return isPipelineStage(stageParam) ? stageParam : null;
  }, [stageParam]);

  const setStageFilter = useCallback(
    (stage: PipelineStage) => {
      const route = PIPELINE_STAGE_CONFIG_BY_ID[stage].route;
      router.push(route);
    },
    [router]
  );

  const clearStageFilter = useCallback(() => {
    router.push('/');
  }, [router]);

  return { activeStage, setStageFilter, clearStageFilter };
}
