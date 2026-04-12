import { aiStudioService } from '@/app/ai/services/aiStudioService';
import { scriptsService } from '@/app/scripts/services/scriptsService';

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export const scriptPipelineService = {
  async runPipeline(authFetch: AuthFetch, input: { channelId: string; scriptId: string; ideaId?: string | null; title: string }) {
    await aiStudioService.executeRun(authFetch, {
      profileKey: 'titles_thumbs',
      channelId: input.channelId,
      input: { ideaId: input.ideaId, scriptId: input.scriptId },
    });

    await scriptsService.createThumbnail(authFetch, {
      title: input.title,
      scriptId: input.scriptId,
      notes: 'Generated from pipeline',
    });
  },
};
