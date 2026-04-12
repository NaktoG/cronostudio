import { aiStudioService } from '@/app/ai/services/aiStudioService';

type AuthFetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export const ideaPipelineService = {
  async runPipeline(authFetch: AuthFetch, input: { channelId: string; ideaId: string }) {
    const scriptData = await aiStudioService.executeRun(authFetch, {
      profileKey: 'script_architect',
      channelId: input.channelId,
      input: { ideaId: input.ideaId },
    });
    const scriptId = (scriptData.applied?.scriptId as string | undefined) ?? null;
    if (!scriptId) {
      throw new Error('Script not generated');
    }

    await aiStudioService.executeRun(authFetch, {
      profileKey: 'titles_thumbs',
      channelId: input.channelId,
      input: { ideaId: input.ideaId, scriptId },
    });

    return { scriptId };
  },
};
