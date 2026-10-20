/** @vitest-environment jsdom */
import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

afterEach(cleanup);

describe('accessible shared controls', () => {
  it('names an icon control while its translated tooltip is closed', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button>
              <svg aria-hidden='true' />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoeken</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByRole('button', { name: 'Zoeken' })).toBeDefined();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('makes an informational icon named and keyboard focusable', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <svg aria-hidden='true' />
            </span>
          </TooltipTrigger>
          <TooltipContent>Transaction details</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(
      screen.getByRole('img', { name: 'Transaction details' }).tabIndex
    ).toBe(0);
  });

  it('preserves the control name rather than overriding it with explanatory text', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button aria-label='Search'>
              <svg aria-hidden='true' />
            </button>
          </TooltipTrigger>
          <TooltipContent>Search using Command K</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
    expect(screen.getByRole('button', { name: 'Search' })).toBeDefined();
  });

  it('exposes progress value and its specific label to assistive technology', () => {
    render(<Progress value={37} aria-label='Import progress' />);
    const progress = screen.getByRole('progressbar', {
      name: 'Import progress',
    });
    expect(progress.getAttribute('aria-valuenow')).toBe('37');
    expect(progress.getAttribute('aria-valuemax')).toBe('100');
  });
});
