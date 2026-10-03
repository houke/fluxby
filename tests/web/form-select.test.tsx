/** @vitest-environment jsdom */
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FormSelect } from '@/components/ui/form-select';

beforeEach(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function Harness({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState('');
  return (
    <form aria-label='Schedule form'>
      <label htmlFor='schedule'>Frequency</label>
      <FormSelect
        id='schedule'
        name='frequency'
        label='Frequency'
        required
        disabled={disabled}
        value={value}
        onChange={setValue}
        options={[
          { value: '', label: 'Choose a frequency' },
          { value: 'monthly', label: 'Monthly' },
          { value: 'fourweekly', label: 'Every four weeks' },
        ]}
      />
      <output aria-label='Selected value'>{value}</output>
    </form>
  );
}

describe('shared form select', () => {
  it('supports labelled keyboard selection and returning to an empty required value', () => {
    render(<Harness />);
    const form = screen.getByRole('form') as HTMLFormElement;
    const trigger = screen.getByRole('combobox', { name: 'Frequency' });
    expect(trigger.textContent).toBe('Choose a frequency');
    expect(form.checkValidity()).toBe(false);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(
      screen.getByRole('option', { name: 'Every four weeks' }),
      { key: 'Enter' }
    );
    expect(screen.getByLabelText('Selected value').textContent).toBe(
      'fourweekly'
    );
    expect(form.checkValidity()).toBe(true);
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(
      screen.getByRole('option', { name: 'Choose a frequency' }),
      { key: 'Enter' }
    );
    expect(screen.getByLabelText('Selected value').textContent).toBe('');
    expect(form.checkValidity()).toBe(false);
  });
  it('keeps disabled selects inaccessible to changes', () => {
    render(<Harness disabled />);
    expect((screen.getByRole('combobox') as HTMLButtonElement).disabled).toBe(
      true
    );
  });
});
