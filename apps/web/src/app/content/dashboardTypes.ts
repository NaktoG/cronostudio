import type { Production } from '@/app/components/ProductionsList';

export interface PipelineStats {
  idea: number;
  scripting: number;
  recording: number;
  editing: number;
  shorts: number;
  publishing: number;
  published: number;
}

export interface PriorityAction {
  id: string;
  type: 'idea' | 'script' | 'seo' | 'thumbnail' | 'short' | 'publish';
  title: string;
  productionTitle: string;
  productionId: string;
  urgency: 'high' | 'medium' | 'low';
  href?: string;
}

export interface WeeklyStatus {
  status: 'OK' | 'EN_RIESGO' | 'FALLIDA';
  nextCondition: { label: string; dueAt: string; missing: string[] } | null;
  channel: { id: string; name: string } | null;
  channelSource: 'explicit' | 'default';
  goal: { targetVideos: number; diasPublicacion: string[]; horaCorte: string };
  week: { isoYear: number; isoWeek: number; startDate: string; endDate: string };
  publishedCount: number;
  publishedThisWeek?: { id: string; title: string; publishedAt: string }[];
  planGenerated?: boolean;
  plannedProductions?: { id: string; title: string; day: string | null; status: string }[];
  currentStreak?: number;
  bestStreak?: number;
  last4Weeks?: { isoYear: number; isoWeek: number; status: 'OK' | 'EN_RIESGO' | 'FALLIDA' }[];
  tasks: PriorityAction[];
}

export interface DisciplineWeekly {
  status: 'OK' | 'EN_RIESGO' | 'FALLIDA' | 'CUMPLIDA';
  channel: { id: string; name: string; source: 'explicit' | 'default' };
  week: { isoYear: number; isoWeek: number; startDate: string; endDate: string; weekKey: string };
  scoreboard: { count: number; target: number };
  deadlines: { tuesday: string | null; friday: string | null };
  streak: { current: number; best: number };
}

export interface YoutubeReconcileWeekly {
  isoYear: number;
  isoWeek: number;
  youtubeChannelId: string | null;
  internalChannelId: string | null;
  expectedSlots: Array<{ key: 'tue' | 'fri'; date: string | null; windowStart: string | null; windowEnd: string | null }>;
  youtubeEvidence: Record<'tue' | 'fri', { matched: boolean; video: { videoId: string; title: string; publishedAt: string; url: string } | null }>;
  publishEvents: Record<'tue' | 'fri', { matched: boolean; eventId: string | null; publishedAt: string | null }>;
  reconciliation: Record<'tue' | 'fri', 'ok' | 'missing_publish_event' | 'missing_youtube_video' | 'mismatch'>;
  suggestedActions: Array<{ type: string; slot: 'tue' | 'fri'; payload: Record<string, unknown> }>;
}

export type DashboardTab = 'production' | 'calendar' | 'backlog' | 'integrations';

export interface WeeklyGoalResponse {
  goal: { targetVideos: number; diasPublicacion: string[]; horaCorte: string };
  channel: { id: string; name: string } | null;
  channelSource: 'explicit' | 'default';
  isoYear: number;
  isoWeek: number;
  source: 'stored' | 'default';
}

export interface Channel {
  id: string;
  name: string;
}

export interface DashboardDataPayload {
  productions: Production[];
}
