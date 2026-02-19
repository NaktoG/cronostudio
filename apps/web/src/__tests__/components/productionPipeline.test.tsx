// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ProductionPipeline from '@/app/components/ProductionPipeline';
import type { PipelineStats } from '@/domain/types';
import { UI_COPY } from '@/config/uiCopy';

describe('ProductionPipeline', () => {
  it('calls onStageClick with the selected stage', () => {
    const stats: PipelineStats = {
      idea: 1,
      scripting: 2,
      recording: 0,
      editing: 1,
      shorts: 0,
      publishing: 0,
      published: 0,
    };
    const onStageClick = vi.fn();

    render(<ProductionPipeline stats={stats} onStageClick={onStageClick} />);

    fireEvent.click(screen.getByText(UI_COPY.pipeline.stages.scripting));
    expect(onStageClick).toHaveBeenCalledWith('scripting');
  });
});
