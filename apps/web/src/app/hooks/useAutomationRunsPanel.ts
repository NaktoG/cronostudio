import { useEffect, useState } from 'react';
import type { AutomationRun } from '@/app/components/AutomationRuns';

interface UseAutomationRunsPanelProps {
  initialRuns: AutomationRun[];
}

export function useAutomationRunsPanel({ initialRuns }: UseAutomationRunsPanelProps) {
  const [runs, setRuns] = useState(initialRuns);

  useEffect(() => {
    setRuns(initialRuns);
  }, [initialRuns]);

  return { runs, setRuns };
}
