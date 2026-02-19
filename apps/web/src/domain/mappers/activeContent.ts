import type { ActiveContentItem, Idea, Production, ProductionStatus } from '@/domain/types';

type BuildActiveContentInput = {
  stage: ProductionStatus | null;
  productions: Production[];
  ideas: Idea[];
};

const toIdeaItem = (idea: Idea): ActiveContentItem => ({
  kind: 'idea',
  id: idea.id,
  title: idea.title,
  description: idea.description ?? null,
  status: idea.status,
  score: idea.priority,
});

const toProductionItem = (production: Production): ActiveContentItem => ({
  kind: 'production',
  id: production.id,
  title: production.title,
  description: production.description ?? null,
  stage: production.status,
});

export function buildActiveContentItems({ stage, productions, ideas }: BuildActiveContentInput): ActiveContentItem[] {
  if (stage === 'idea') {
    return ideas.map(toIdeaItem);
  }

  const activeProductions = productions.filter((production) => production.status !== 'published');
  const filteredProductions = stage
    ? activeProductions.filter((production) => production.status === stage)
    : activeProductions;

  return filteredProductions.map(toProductionItem);
}
