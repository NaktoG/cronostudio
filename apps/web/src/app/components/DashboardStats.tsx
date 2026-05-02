'use client';

export interface PipelineStats {
  idea: number;
  scripting: number;
  recording: number;
  editing: number;
  shorts: number;
  publishing: number;
  published: number;
}

interface DashboardStatsProps {
  stats: PipelineStats;
}

const stageLabels: Record<keyof PipelineStats, string> = {
  idea: 'Ideas',
  scripting: 'Guion',
  recording: 'Grabación',
  editing: 'Edición',
  shorts: 'Shorts',
  publishing: 'Publicando',
  published: 'Publicado',
};

const stageColors: Record<keyof PipelineStats, string> = {
  idea: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  scripting: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  recording: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  editing: 'bg-green-500/10 text-green-400 border-green-500/20',
  shorts: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  publishing: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export default function DashboardStats({ stats }: DashboardStatsProps) {
  const stages = Object.keys(stats) as Array<keyof PipelineStats>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
      {stages.map((stage) => (
        <motion.div
          key={stage}
          className={`p-3 sm:p-4 rounded-xl border ${stageColors[stage]}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-xs sm:text-sm font-medium">{stageLabels[stage]}</div>
          <div className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold">
            {stats[stage]}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
