/** @vitest-environment jsdom */
import React, { useState } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

afterEach(cleanup);
function Example({ preventEscape = false }: { preventEscape?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        onEscapeKeyDown={(event) => {
          if (preventEscape) event.preventDefault();
        }}
      >
        <DialogTitle>Confirmation</DialogTitle>
        <DialogDescription>Review before deleting</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
describe('dialog close tooltip keyboard behavior', () => {
  it('closes with one Escape while its close tooltip is focused', async () => {
    render(<Example />);
    const close = screen.getByRole('button', { name: /Close|Sluiten/ });
    fireEvent.focus(close);
    await screen.findByRole('tooltip');
    fireEvent.keyDown(close, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
  it('respects a dialog Escape veto while dismissing its focused tooltip', async () => {
    render(<Example preventEscape />);
    const close = screen.getByRole('button', { name: /Close|Sluiten/ });
    fireEvent.focus(close);
    await screen.findByRole('tooltip');
    fireEvent.keyDown(close, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
    expect(screen.queryByRole('dialog')).not.toBeNull();
  });
});
