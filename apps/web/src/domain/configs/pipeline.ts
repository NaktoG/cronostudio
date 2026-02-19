import {
  CheckCircle2,
  FileText,
  Lightbulb,
  Smartphone,
  Scissors,
  Upload,
  Video,
} from 'lucide-react';
import { UI_COPY } from '@/config/uiCopy';
import type { PipelineStage } from '@/domain/types';
import type { PipelineStageConfig } from '@/domain/types/pipeline';

export const PIPELINE_STAGE_QUERY_KEY = 'stage' as const;

const buildStageRoute = (stage: PipelineStage): string => `/?${PIPELINE_STAGE_QUERY_KEY}=${stage}`;

export const PIPELINE_STAGE_CONFIGS: PipelineStageConfig[] = [
  {
    id: 'idea',
    icon: Lightbulb,
    label: UI_COPY.pipeline.stages.idea,
    route: buildStageRoute('idea'),
    queryKey: PIPELINE_STAGE_QUERY_KEY,
  },
  {
    id: 'scripting',
    icon: FileText,
    label: UI_COPY.pipeline.stages.scripting,
    route: buildStageRoute('scripting'),
    queryKey: PIPELINE_STAGE_QUERY_KEY,
  },
  {
    id: 'recording',
    icon: Video,
    label: UI_COPY.pipeline.stages.recording,
    route: buildStageRoute('recording'),
    queryKey: PIPELINE_STAGE_QUERY_KEY,
  },
  {
    id: 'editing',
    icon: Scissors,
    label: UI_COPY.pipeline.stages.editing,
    route: buildStageRoute('editing'),
    queryKey: PIPELINE_STAGE_QUERY_KEY,
  },
  {
    id: 'shorts',
    icon: Smartphone,
    label: UI_COPY.pipeline.stages.shorts,
    route: buildStageRoute('shorts'),
    queryKey: PIPELINE_STAGE_QUERY_KEY,
  },
  {
    id: 'publishing',
    icon: Upload,
    label: UI_COPY.pipeline.stages.publishing,
    route: buildStageRoute('publishing'),
    queryKey: PIPELINE_STAGE_QUERY_KEY,
  },
  {
    id: 'published',
    icon: CheckCircle2,
    label: UI_COPY.pipeline.stages.published,
    route: buildStageRoute('published'),
    queryKey: PIPELINE_STAGE_QUERY_KEY,
  },
];

export const PIPELINE_STAGE_CONFIG_BY_ID: Record<PipelineStage, PipelineStageConfig> =
  PIPELINE_STAGE_CONFIGS.reduce((acc, stage) => {
    acc[stage.id] = stage;
    return acc;
  }, {} as Record<PipelineStage, PipelineStageConfig>);
